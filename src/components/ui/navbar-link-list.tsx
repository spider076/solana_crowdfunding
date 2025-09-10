import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { WalletButton } from "../solana/solana-provider";
import { ClusterUiSelect } from "../cluster/cluster-ui";
import { SetStateAction } from "jotai";

const NavbarLinkList = ({
  links,
  showMenu,
  setShowMenu,
}: {
  links: { label: string; path: string }[];
  showMenu: boolean;
  setShowMenu: React.Dispatch<SetStateAction<boolean>>;
}) => {
  const pathname = usePathname();
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 724) {
        setShowMenu(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  return (
    <ul
      className={`${
        showMenu
          ? "absolute top-[70px] z-40 flex h-[calc(100vh-130px)] w-screen flex-col items-center justify-center gap-4 bg-gray-800 md:w-[unset] md:h-[unset]"
          : "hidden items-center space-x-2 px-1 md:flex w-full"
      } gap-4 md:gap-8`}
    >
      {links.map(({ label, path }) => (
        <li key={path} onClick={() => setShowMenu(false)} className="">
          <Link
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith(path)
                ? "bg-gray-900 text-white"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
            href={path}
          >
            {label}
          </Link>
        </li>
      ))}
      <li className={`${showMenu ? " " : "ml-auto flex-1"}`}></li>
      <li>
        <ul className="flex flex-col items-center gap-2 md:flex-row">
          <li className="" onClick={(e) => e.stopPropagation()}>
            <WalletButton />
          </li>
          <li
            className=""
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <ClusterUiSelect setShowMenu={setShowMenu} />
          </li>
        </ul>
      </li>
    </ul>
  );
};

export default NavbarLinkList;
