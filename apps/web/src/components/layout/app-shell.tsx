import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell() {
  const [sidebarMovilAbierto, setSidebarMovilAbierto] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop: sidebar fijo en el layout */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Móvil/tablet: sidebar off-canvas sobre el contenido */}
      <AnimatePresence>
        {sidebarMovilAbierto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarMovilAbierto(false)}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 md:hidden"
            >
              <Sidebar onNavigate={() => setSidebarMovilAbierto(false)} forzarExpandido />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onAbrirMenuMovil={() => setSidebarMovilAbierto(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
