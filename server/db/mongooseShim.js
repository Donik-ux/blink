// Лёгкий in-memory Mongoose-совместимый шим.
// Поддерживает только тот набор API, который реально используется в проекте.
// Данные сохраняются в JSON-файл, чтобы переживали перезапуск сервера.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data', 'db.json');

// ---------- ObjectId ----------
const HEX = '0123456789abcdef';
const makeId = () => {
  let s = '';
  for (let i = 0; i < 24; i++) s += HEX[Math.floor(Math.random() * 16)];
  return s;
};

class ObjectId {
  constructor(id) {
    this._id = id ? String(id) : makeId();
  }
  toString() {
    return this._id;
  }
  equals(other) {
    return other != null && this._id === String(other);
  }
  toJSON() {
    return this._id;
  }
}

const idOf = (v) => {
  if (v == null) return v;
  if (v instanceof ObjectId) return v.toString();
  if (typeof v === 'object' && v._id) return String(v._id);
  return String(v);
};

// ---------- Хранилище ----------
const collections = new Map(); // name -> Map<id, doc>
const modelRegistry = new Map(); // name -> Model class

const getCol = (name) => {
  if (!collections.has(name)) collections.set(name, new Map());
  return collections.get(name);
};

let saveTimer = null;
const scheduleSave = () => {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    persist();
  }, 100);
};

const persist = () => {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const payload = {};
    for (const [name, col] of collections.entries()) {
      payload[name] = Array.from(col.values());
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error('Ошибка сохранения БД:', err.message);
  }
};

const loadFromDisk = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const payload = JSON.parse(raw);
    for (const [name, docs] of Object.entries(payload)) {
      const col = getCol(name);
      for (const doc of docs) {
        // Восстанавливаем даты
        for (const k of Object.keys(doc)) {
          if (typeof doc[k] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(doc[k])) {
            const d = new Date(doc[k]);
            if (!isNaN(d.getTime())) doc[k] = d;
          }
        }
        col.set(String(doc._id), doc);
      }
    }
  } catch (err) {
    console.error('Ошибка чтения БД:', err.message);
  }
};

// ---------- Schema ----------
class Schema {
  constructor(fields, options = {}) {
    this.fields = fields || {};
    this.options = options;
    this.indexes = [];
  }
  index(spec, opts) {
    this.indexes.push({ spec, opts });
  }
  pre() {}
  post() {}
  virtual() {
    return { get() {}, set() {} };
  }
}
Schema.Types = {
  ObjectId: 'ObjectId',
  Mixed: 'Mixed',
  String: 'String',
  Number: 'Number',
  Date: 'Date',
  Boolean: 'Boolean',
};

// ---------- Применение значений по умолчанию ----------
const isPlainDef = (def) => {
  if (def === null || def === undefined) return false;
  if (typeof def !== 'object') return true;
  // Spec object like { type: ..., default: ..., required: ... }
  return !('type' in def) && !Array.isArray(def);
};

const applyDefaults = (schema, data) => {
  const out = { ...data };
  for (const [key, spec] of Object.entries(schema.fields)) {
    if (out[key] !== undefined) continue;
    if (Array.isArray(spec)) {
      if (out[key] === undefined) out[key] = [];
      continue;
    }
    if (spec && typeof spec === 'object' && 'default' in spec) {
      const def = spec.default;
      out[key] = typeof def === 'function' ? def() : def;
    }
    // Map тип
    if (spec && typeof spec === 'object' && spec.type === Map) {
      if (!out[key] || typeof out[key] !== 'object') out[key] = {};
    }
  }
  return out;
};

// ---------- Сравнение значений ----------
const matchValue = (docVal, qVal) => {
  if (qVal && typeof qVal === 'object' && !Array.isArray(qVal) && !(qVal instanceof Date) && !(qVal instanceof ObjectId)) {
    // Оператор
    for (const [op, val] of Object.entries(qVal)) {
      if (op === '$in') {
        const arr = val.map(idOf);
        if (Array.isArray(docVal)) {
          if (!docVal.some((d) => arr.includes(idOf(d)))) return false;
        } else {
          if (!arr.includes(idOf(docVal))) return false;
        }
      } else if (op === '$all') {
        const arr = val.map(idOf);
        const docArr = (Array.isArray(docVal) ? docVal : []).map(idOf);
        if (!arr.every((a) => docArr.includes(a))) return false;
      } else if (op === '$gte') {
        if (!(docVal >= val)) return false;
      } else if (op === '$lte') {
        if (!(docVal <= val)) return false;
      } else if (op === '$gt') {
        if (!(docVal > val)) return false;
      } else if (op === '$lt') {
        if (!(docVal < val)) return false;
      } else if (op === '$ne') {
        if (idOf(docVal) === idOf(val)) return false;
      } else if (op === '$exists') {
        const exists = docVal !== undefined;
        if (exists !== Boolean(val)) return false;
      } else {
        return false;
      }
    }
    return true;
  }
  // Прямое равенство
  if (qVal instanceof Date) {
    return docVal instanceof Date && docVal.getTime() === qVal.getTime();
  }
  if (Array.isArray(docVal)) {
    return docVal.some((d) => idOf(d) === idOf(qVal));
  }
  return idOf(docVal) === idOf(qVal);
};

const matchDoc = (doc, query) => {
  if (!query || Object.keys(query).length === 0) return true;
  for (const [key, qVal] of Object.entries(query)) {
    if (key === '$or') {
      if (!qVal.some((sub) => matchDoc(doc, sub))) return false;
    } else if (key === '$and') {
      if (!qVal.every((sub) => matchDoc(doc, sub))) return false;
    } else {
      if (!matchValue(doc[key], qVal)) return false;
    }
  }
  return true;
};

// ---------- Query (thenable) ----------
class Query {
  constructor(model, query, mode) {
    this.model = model;
    this.query = query || {};
    this.mode = mode; // 'many' | 'one' | 'count' | 'updateMany' | 'delete'
    this._populates = [];
    this._sort = null;
    this._limit = null;
    this._select = null;
    this._update = null;
  }
  populate(path, select) {
    this._populates.push({ path, select });
    return this;
  }
  sort(spec) {
    this._sort = spec;
    return this;
  }
  limit(n) {
    this._limit = n;
    return this;
  }
  select(s) {
    this._select = s;
    return this;
  }
  async exec() {
    const col = getCol(this.model.collectionName);
    let docs = Array.from(col.values()).filter((d) => matchDoc(d, this.query));

    if (this._sort) {
      const entries = Object.entries(this._sort);
      docs.sort((a, b) => {
        for (const [k, dir] of entries) {
          const av = a[k];
          const bv = b[k];
          if (av === bv) continue;
          if (av === undefined) return 1;
          if (bv === undefined) return -1;
          return av > bv ? dir : -dir;
        }
        return 0;
      });
    }
    if (this._limit != null) docs = docs.slice(0, this._limit);

    // Инстанцируем и populates
    const instances = [];
    for (const d of docs) {
      const inst = this.model._hydrate(d);
      for (const p of this._populates) {
        await inst.populate(p.path, p.select);
      }
      instances.push(inst);
    }

    if (this.mode === 'one') return instances[0] || null;
    if (this.mode === 'count') return instances.length;
    return instances;
  }
  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }
  catch(onRejected) {
    return this.exec().catch(onRejected);
  }
}

// ---------- Model ----------
const applyUpdate = (doc, update) => {
  for (const [key, val] of Object.entries(update)) {
    if (key === '$set') {
      for (const [k, v] of Object.entries(val)) {
        // Поддержка "nested.path"
        if (k.includes('.')) {
          const parts = k.split('.');
          let cur = doc;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
            cur = cur[parts[i]];
          }
          cur[parts[parts.length - 1]] = v;
        } else {
          doc[k] = v;
        }
      }
    } else if (key === '$inc') {
      for (const [k, v] of Object.entries(val)) {
        doc[k] = (doc[k] || 0) + v;
      }
    } else if (key === '$push') {
      for (const [k, v] of Object.entries(val)) {
        if (!Array.isArray(doc[k])) doc[k] = [];
        doc[k].push(v);
      }
    } else if (key === '$pull') {
      for (const [k, v] of Object.entries(val)) {
        if (Array.isArray(doc[k])) {
          doc[k] = doc[k].filter((x) => idOf(x) !== idOf(v));
        }
      }
    } else {
      doc[key] = val;
    }
  }
};

const createModel = (name, schema) => {
  const collectionName = name;
  const timestamps = schema.options?.timestamps !== false && schema.options?.timestamps !== undefined
    ? schema.options.timestamps
    : schema.options?.timestamps;
  const useTimestamps = schema.options?.timestamps === true;

  // Находим поля, которые являются ref на другую модель
  const refs = {};
  for (const [key, spec] of Object.entries(schema.fields)) {
    if (Array.isArray(spec) && spec[0]?.ref) {
      refs[key] = spec[0].ref;
    } else if (spec && typeof spec === 'object' && spec.ref) {
      refs[key] = spec.ref;
    }
  }

  // Поддержка Map-полей
  const mapFields = new Set();
  for (const [key, spec] of Object.entries(schema.fields)) {
    if (spec && typeof spec === 'object' && spec.type === Map) mapFields.add(key);
  }

  class Model {
    constructor(data = {}) {
      const withDefaults = applyDefaults(schema, data);
      Object.assign(this, withDefaults);

      if (!this._id) this._id = makeId();
      this._id = String(this._id);

      const now = new Date();
      if (useTimestamps) {
        if (!this.createdAt) this.createdAt = now;
        this.updatedAt = now;
      } else if (schema.fields.updatedAt && !this.updatedAt) {
        this.updatedAt = now;
      }

      // Оборачиваем Map-поля
      for (const k of mapFields) {
        if (!(this[k] instanceof Map)) {
          const src = this[k] || {};
          this[k] = new Map(Object.entries(src));
        }
      }
    }

    async save() {
      if (useTimestamps) this.updatedAt = new Date();
      const plain = Model._toPlain(this);
      getCol(collectionName).set(this._id, plain);
      scheduleSave();
      return this;
    }

    async populate(pathOrArr, select) {
      const paths = Array.isArray(pathOrArr) ? pathOrArr : String(pathOrArr).split(/\s+/);
      for (const p of paths) {
        if (!p) continue;
        const refModelName = refs[p];
        if (!refModelName) continue;
        const refModel = modelRegistry.get(refModelName);
        if (!refModel) continue;

        const val = this[p];
        if (val == null) continue;

        if (Array.isArray(val)) {
          const hydrated = [];
          for (const item of val) {
            const id = idOf(item);
            const doc = getCol(refModel.collectionName).get(id);
            if (doc) {
              const inst = refModel._hydrate(doc);
              hydrated.push(pickFields(inst, select));
            } else {
              hydrated.push(item);
            }
          }
          this[p] = hydrated;
        } else {
          const id = idOf(val);
          const doc = getCol(refModel.collectionName).get(id);
          if (doc) {
            const inst = refModel._hydrate(doc);
            this[p] = pickFields(inst, select);
          }
        }
      }
      return this;
    }

    toObject() {
      return Model._toPlain(this);
    }

    toJSON() {
      return Model._toPlain(this);
    }
  }

  Model.collectionName = collectionName;
  Model.schema = schema;
  Model.modelName = name;

  Model._toPlain = (inst) => {
    const out = {};
    for (const [k, v] of Object.entries(inst)) {
      if (v instanceof Map) {
        out[k] = Object.fromEntries(v);
      } else if (v instanceof ObjectId) {
        out[k] = v.toString();
      } else if (v instanceof Date) {
        out[k] = v;
      } else {
        out[k] = v;
      }
    }
    return out;
  };

  Model._hydrate = (doc) => {
    // Возвращаем новый экземпляр без повторного применения defaults
    const inst = Object.create(Model.prototype);
    Object.assign(inst, doc);
    for (const k of mapFields) {
      if (!(inst[k] instanceof Map)) {
        inst[k] = new Map(Object.entries(inst[k] || {}));
      }
    }
    return inst;
  };

  Model.create = async (data) => {
    if (Array.isArray(data)) {
      const arr = [];
      for (const d of data) {
        const m = new Model(d);
        await m.save();
        arr.push(m);
      }
      return arr;
    }
    const m = new Model(data);
    await m.save();
    return m;
  };

  Model.find = (query) => new Query(Model, query, 'many');
  Model.findOne = (query) => new Query(Model, query, 'one');
  Model.findById = (id) => new Query(Model, { _id: String(id) }, 'one');
  Model.countDocuments = async (query) => {
    const col = getCol(collectionName);
    return Array.from(col.values()).filter((d) => matchDoc(d, query || {})).length;
  };

  Model.findByIdAndUpdate = async (id, update, options = {}) => {
    const col = getCol(collectionName);
    const doc = col.get(String(id));
    if (!doc) {
      if (options.upsert) {
        const created = new Model({ _id: String(id), ...flattenUpdate(update) });
        await created.save();
        return options.new ? created : null;
      }
      return null;
    }
    applyUpdate(doc, update);
    if (useTimestamps) doc.updatedAt = new Date();
    col.set(String(id), doc);
    scheduleSave();
    return Model._hydrate(doc);
  };

  Model.findOneAndUpdate = async (query, update, options = {}) => {
    const col = getCol(collectionName);
    const existing = Array.from(col.values()).find((d) => matchDoc(d, query));
    if (existing) {
      applyUpdate(existing, update);
      if (useTimestamps) existing.updatedAt = new Date();
      col.set(existing._id, existing);
      scheduleSave();
      return Model._hydrate(existing);
    }
    if (options.upsert) {
      const base = { ...query, ...flattenUpdate(update) };
      // Убираем операторы из query
      for (const k of Object.keys(base)) {
        if (k.startsWith('$')) delete base[k];
      }
      const m = new Model(base);
      await m.save();
      return options.new ? m : null;
    }
    return null;
  };

  Model.findByIdAndDelete = async (id) => {
    const col = getCol(collectionName);
    const doc = col.get(String(id));
    if (!doc) return null;
    col.delete(String(id));
    scheduleSave();
    return Model._hydrate(doc);
  };

  Model.deleteOne = async (query) => {
    const col = getCol(collectionName);
    const found = Array.from(col.values()).find((d) => matchDoc(d, query));
    if (found) {
      col.delete(found._id);
      scheduleSave();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  };

  Model.deleteMany = async (query) => {
    const col = getCol(collectionName);
    const ids = Array.from(col.values())
      .filter((d) => matchDoc(d, query || {}))
      .map((d) => d._id);
    for (const id of ids) col.delete(id);
    if (ids.length) scheduleSave();
    return { deletedCount: ids.length };
  };

  Model.updateMany = async (query, update) => {
    const col = getCol(collectionName);
    const list = Array.from(col.values()).filter((d) => matchDoc(d, query || {}));
    const wrapped = Object.keys(update).some((k) => k.startsWith('$'))
      ? update
      : { $set: update };
    for (const d of list) {
      applyUpdate(d, wrapped);
      if (useTimestamps) d.updatedAt = new Date();
      col.set(d._id, d);
    }
    if (list.length) scheduleSave();
    return { modifiedCount: list.length };
  };

  Model.exists = async (query) => {
    const col = getCol(collectionName);
    const found = Array.from(col.values()).find((d) => matchDoc(d, query));
    return found ? { _id: found._id } : null;
  };

  modelRegistry.set(name, Model);
  return Model;
};

const flattenUpdate = (update) => {
  if (!update) return {};
  const out = {};
  for (const [k, v] of Object.entries(update)) {
    if (k === '$set' || k === '$setOnInsert') Object.assign(out, v);
    else if (!k.startsWith('$')) out[k] = v;
  }
  return out;
};

const pickFields = (inst, select) => {
  if (!select) return inst;
  const fields = select.split(/\s+/).filter(Boolean);
  const out = { _id: inst._id };
  for (const f of fields) {
    if (f.startsWith('-')) continue;
    if (inst[f] !== undefined) out[f] = inst[f];
  }
  return out;
};

// ---------- mongoose-compatible default export ----------
const mongoose = {
  Schema,
  model: (name, schema) => {
    if (modelRegistry.has(name)) return modelRegistry.get(name);
    if (!schema) throw new Error(`Schema required for ${name}`);
    return createModel(name, schema);
  },
  Types: { ObjectId },
  connect: async () => {
    loadFromDisk();
    return mongoose;
  },
  connection: {
    on: () => {},
    once: () => {},
  },
  set: () => {},
};

// ВАЖНО: загрузка с диска при первом импорте (даже без connect)
loadFromDisk();

// Flush при выходе
const flushOnExit = () => {
  try {
    persist();
  } catch {}
};
process.on('SIGINT', flushOnExit);
process.on('SIGTERM', flushOnExit);
process.on('beforeExit', flushOnExit);

export default mongoose;
export { Schema, ObjectId };
