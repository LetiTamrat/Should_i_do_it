export function TopNav() {
  return (
    <nav className="border-b-2 border-fg flex justify-between items-center w-full px-6 md:px-10 py-4 sticky top-0 z-40 bg-bg">
      <div className="text-label md:text-base font-display text-fg flex-1 tracking-tight">
        SHOULD I DO IT
      </div>
      <div className="hidden lg:flex border border-white px-4 py-2 text-white items-center gap-2 mx-4 max-w-md">
        <span className="text-label-xs truncate">
          Yesterday: 8,432 people asked about texting their ex →
        </span>
      </div>
      <div className="flex items-center gap-6 flex-1 justify-end">
        <a
          href="#"
          className="bg-lime text-black px-4 md:px-6 py-2 border-2 border-lime hover:bg-bg hover:text-lime transition-none text-label-xs md:text-label whitespace-nowrap"
        >
          Bad Decision of the Day
        </a>
      </div>
    </nav>
  );
}
