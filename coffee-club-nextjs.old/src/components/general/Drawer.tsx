import React from "react";
import Image from "next/image";

interface DrawerProps {
  children: any;
  isOpen: boolean;
  handleClose: () => void;
}

export const Drawer = ({ isOpen, handleClose, children }: DrawerProps) => {
  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-[#0d0d24a3]" onClick={handleClose} />}
      <div
        style={{
          background: "linear-gradient(180deg, #0D0D24 0%, #000018 100%)",
        }}
        className={`z-50 fixed bottom-0 md:top-0 right-0 h-[90vh] md:h-screen w-screen md:w-[400px] flex flex-col b-none px-[12px] py-[40px] md:pb-[10px] gap-y-[56px] rounded-t-[32px] md:rounded-tr-none md:rounded-l-[32px] overflow-scroll transition-transform duration-500 ${
          isOpen
            ? "translate-x-0 translate-y-0"
            : "md:translate-x-full translate-y-full md:translate-y-0"
        }`}
      >
        <button className="absolute top-4 right-4" onClick={handleClose}>
          <Image src="/general/close-drawer.svg" width={36} height={36} alt="Close" />
        </button>
        {children}
      </div>
    </>
  );
};
