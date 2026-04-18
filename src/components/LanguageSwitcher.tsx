import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "sw", label: "Kiswahili" },
  { code: "de", label: "Deutsch" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = LANGS.find(l => l.code === i18n.resolvedLanguage)?.code || "en";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-9 h-9 rounded-full hover:bg-foreground/5 flex items-center justify-center transition-colors" aria-label="Language">
        <Globe className="w-4 h-4 text-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LANGS.map(l => (
          <DropdownMenuItem key={l.code} onClick={() => i18n.changeLanguage(l.code)}
            className={current === l.code ? "bg-primary/10 text-primary font-medium" : ""}>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
