import React, { useEffect, useState } from 'react';

const Philosophy: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="min-h-[50vh] pt-40 pb-20 w-full flex flex-col justify-center items-center px-6 text-center bg-black relative overflow-hidden">
      <div className={`max-w-4xl transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-white leading-tight md:leading-snug">
          <span className="block mb-4 md:mb-6">
            Ever-changing patterns frozen at a single moment
          </span>
          <span className="block text-gray-500 font-light italic text-2xl md:text-4xl lg:text-5xl">
            Algorithmic beauty carved into tangible relief
          </span>
        </h1>
      </div>
    </section>
  );
};

export default Philosophy;