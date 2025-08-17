// app/saved-templates.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";

export type TemplateItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  screen: string; // hangi ekran (Template1, Template2 vs.)
  state: any;     // chart slotları, floating kartlar vs.
};

const STORAGE_KEY = "SAVED_TEMPLATES";

// Listeyi yükle
export async function loadList(): Promise<TemplateItem[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      return JSON.parse(json) as TemplateItem[];
    }
    return [];
  } catch (e) {
    console.error("loadList error", e);
    return [];
  }
}

// Kaydet
export async function saveTemplate(template: TemplateItem) {
  try {
    const list = await loadList();
    const newList = [...list, template];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  } catch (e) {
    console.error("saveTemplate error", e);
  }
}

// Yeniden adlandır
export async function renameTemplate(id: string, newName: string) {
  try {
    const list = await loadList();
    const updated = list.map((t) =>
      t.id === id ? { ...t, name: newName, updatedAt: new Date().toISOString() } : t
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("renameTemplate error", e);
  }
}

// Sil
export async function deleteTemplate(id: string) {
  try {
    const list = await loadList();
    const filtered = list.filter((t) => t.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("deleteTemplate error", e);
  }
}
