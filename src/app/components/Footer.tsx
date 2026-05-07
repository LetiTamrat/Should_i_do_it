export function Footer() {
  return (
    <footer className="border-t-2 border-fg flex flex-col md:flex-row justify-between items-center w-full px-6 md:px-10 py-3 gap-3">
      <div className="text-label-xs text-outline">
        © 2026 JUDGMENT ENGINE. PROCEED AT YOUR OWN PERIL.
      </div>
      <div className="flex gap-6">
        <a className="text-label-xs text-outline hover:text-lime hover:underline" href="#">
          SYSTEM_LOGS
        </a>
        <a className="text-label-xs text-outline hover:text-lime hover:underline" href="#">
          TERMINATE_SESSION
        </a>
        <a className="text-label-xs text-outline hover:text-lime hover:underline" href="#">
          DISCLAIMER
        </a>
      </div>
    </footer>
  );
}
