import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Eye, Lock, Shield, MapPin } from 'lucide-react';

const slides = [
  {
    icon: Eye,
    title: 'Видь друзей',
    description: 'Вживую на карте в любой момент времени',
    color: 'from-accent to-accent3'
  },
  {
    icon: MapPin,
    title: 'Локация 24/7',
    description: 'Делись геолокацией с близкими и будьте на связи',
    color: 'from-accent2 to-accent'
  },
  {
    icon: Shield,
    title: 'Полный контроль',
    description: 'Включи режим призрака, чтобы исчезнуть с радаров',
    color: 'from-orange-500 to-accent2'
  },
];

export const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      localStorage.setItem('onboarding_done', 'true');
      navigate('/login');
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_done', 'true');
    navigate('/login');
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="relative min-h-screen bg-bg flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Glow based on current slide */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none transition-colors duration-1000">
        <div className={`absolute top-[10%] left-[50%] transform -translate-x-1/2 w-[60%] h-[50%] rounded-full bg-gradient-to-r ${slide.color} opacity-20 blur-[100px] animate-pulse`} />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center h-full max-h-[800px]">
        {/* Logo indicator */}
        <div className="mt-8 mb-auto text-center">
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 tracking-widest uppercase">Blink</h1>
        </div>

        {/* Card */}
        <div className="w-full bg-surface/30 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 mb-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 transform relative overflow-hidden flex flex-col items-center min-h-[340px] justify-center">
          
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white to-transparent" />

          {/* Icon Container */}
          <div key={currentSlide} className="animate-fadeIn relative z-10 w-28 h-28 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center mb-8 shadow-2xl backdrop-blur-md">
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${slide.color} opacity-20 blur-xl`} />
            <Icon size={48} className="text-white relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          </div>

          <h1 key={`title-${currentSlide}`} className="text-3xl font-extrabold text-white text-center mb-4 tracking-tight animate-slideUp relative z-10">
              {slide.title}
          </h1>
          <p key={`desc-${currentSlide}`} className="text-white/60 text-center leading-relaxed font-medium text-sm animate-slideUp relative z-10" style={{animationDelay: '100ms'}}>
              {slide.description}
          </p>
        </div>

        {/* Индикаторы слайдов */}
        <div className="flex gap-2.5 justify-center mb-10 w-full px-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                index === currentSlide ? `bg-gradient-to-r ${slide.color} w-10 shadow-[0_0_10px_rgba(255,255,255,0.5)]` : 'bg-white/20 w-3'
              }`}
            />
          ))}
        </div>

        {/* Кнопки */}
        <div className="w-full px-6 pb-8 mt-auto">
            <button
            onClick={handleNext}
            className={`w-full bg-gradient-to-r ${slide.color} text-white py-4 rounded-2xl font-bold mb-4 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-2 group relative overflow-hidden`}
            >
            <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform" />
            <span className="relative z-10 text-base">{currentSlide === slides.length - 1 ? 'Начать использование' : 'Продолжить'}</span>
            <ChevronRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
            onClick={handleSkip}
            className="w-full bg-transparent text-white/40 py-3 rounded-xl font-semibold hover:text-white transition-colors text-sm"
            >
            Пропустить
            </button>
        </div>
      </div>
    </div>
  );
};

