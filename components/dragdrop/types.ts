export type SlotId = string; // "lv1", "chart1" gibi
export type WidgetType = 'lastValue' | 'chart';

export type Widget = {
  id: string;        // "lastValue:AYP1-TTMP" gibi benzersiz
  type: WidgetType;
};

export type Frame = { x: number; y: number; width: number; height: number };

export type Slot = {
  id: SlotId;
  accepts: WidgetType[];     // ['lastValue'] veya ['chart']
  widgetId: string | null;   // bu slota yerleşmiş widget
  frame?: Frame;             // drop için ölçüler
};
