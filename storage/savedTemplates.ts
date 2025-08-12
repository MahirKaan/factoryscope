// storage/savedTemplates.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TemplateSnapshot = {
  id: string;
  name: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  screen: 'Template1';
  state: {
    slots: any;      // { slot1: ChartConfig|null, slot2: ChartConfig|null }
    floating: any[]; // floating kartların konfigleri
  };
};

const LIST_KEY = 'factorypulse/saves/list/v1';
const ITEM_KEY = (id: string) => `factorypulse/saves/item/${id}/v1`;

export async function loadList(): Promise<Omit<TemplateSnapshot,'state'>[]> {
  const raw = await AsyncStorage.getItem(LIST_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export async function saveNewTemplate(snap: TemplateSnapshot) {
  const list = await loadList();
  const meta = { id: snap.id, name: snap.name, createdAt: snap.createdAt, updatedAt: snap.updatedAt, screen: snap.screen };
  const newList = [meta, ...list.filter(x => x.id !== snap.id)];
  await AsyncStorage.setItem(LIST_KEY, JSON.stringify(newList));
  await AsyncStorage.setItem(ITEM_KEY(snap.id), JSON.stringify(snap));
}

export async function updateTemplateMeta(id: string, updater: (m: any)=>any) {
  const list = await loadList();
  const newList = list.map(m => m.id === id ? updater(m) : m);
  await AsyncStorage.setItem(LIST_KEY, JSON.stringify(newList));
}

export async function getTemplate(id: string): Promise<TemplateSnapshot | null> {
  const raw = await AsyncStorage.getItem(ITEM_KEY(id));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function renameTemplate(id: string, newName: string) {
  const item = await getTemplate(id);
  if (!item) return;
  const updated: TemplateSnapshot = { ...item, name: newName, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(ITEM_KEY(id), JSON.stringify(updated));
  await updateTemplateMeta(id, (m:any)=>({ ...m, name: newName, updatedAt: updated.updatedAt }));
}

export async function deleteTemplate(id: string) {
  const list = await loadList();
  const newList = list.filter(m => m.id !== id);
  await AsyncStorage.setItem(LIST_KEY, JSON.stringify(newList));
  await AsyncStorage.removeItem(ITEM_KEY(id));
}
