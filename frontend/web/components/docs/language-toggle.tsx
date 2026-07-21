"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocs, type DocsLanguage } from "@/lib/docs-context";

export function LanguageToggle() {
  const { language, setLanguage } = useDocs();

  return (
    <Tabs value={language} onValueChange={(v) => setLanguage(v as DocsLanguage)}>
      <TabsList>
        <TabsTrigger value="javascript">JavaScript</TabsTrigger>
        <TabsTrigger value="python">Python</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
