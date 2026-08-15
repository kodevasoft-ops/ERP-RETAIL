import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

interface Props {
  valor: number;
  formato?: (n: number) => string;
  duracionMs?: number;
}

/**
 * Anima la transición entre el valor anterior y el nuevo — un dashboard
 * "vivo" en vez de números que simplemente aparecen/desaparecen al
 * refrescar. Sutil (200-600ms), consistente con las duraciones del
 * design system (nunca rebote ni easing exagerado).
 */
export function AnimatedNumber({ valor, formato = (n) => Math.round(n).toLocaleString("es-CO"), duracionMs = 600 }: Props) {
  const [mostrado, setMostrado] = useState(0);
  const anterior = useRef(0);

  useEffect(() => {
    const controls = animate(anterior.current, valor, {
      duration: duracionMs / 1000,
      ease: "easeOut",
      onUpdate: (v) => setMostrado(v),
    });
    anterior.current = valor;
    return () => controls.stop();
  }, [valor, duracionMs]);

  return <>{formato(mostrado)}</>;
}
