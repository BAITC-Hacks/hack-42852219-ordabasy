import type {
  DevelopmentCategory,
  IndicatorCode,
} from "@/entities/district";

export type InitiativeId =
  | "M1" | "M2" | "M3" | "M4" | "M5" | "M6" | "M7"
  | "M8" | "M9" | "M10" | "M11" | "M12" | "M13" | "M14";

export type InitiativeScope = "DISTRICT" | "CITY";

export interface InitiativeEffect {
  indicator: IndicatorCode;
  value: number;
}

export interface Initiative {
  id: InitiativeId;
  category: DevelopmentCategory;
  name: string;
  shortName: string;
  scope: InitiativeScope;
  cost: number;
  lag: number;
  effects: readonly InitiativeEffect[];
}

export const INITIATIVES: readonly Initiative[] = [
  { id: "M1", category: "TRANSPORT", name: "Выделенные полосы для автобусов", shortName: "Автобусные полосы", scope: "DISTRICT", cost: 18, lag: 2, effects: [{ indicator: "T1", value: 6 }, { indicator: "T2", value: 9 }] },
  { id: "M2", category: "TRANSPORT", name: "Умные светофоры (адаптивное управление)", shortName: "Умные светофоры", scope: "CITY", cost: 22, lag: 2, effects: [{ indicator: "T1", value: 4 }, { indicator: "B2", value: 3 }] },
  { id: "M3", category: "TRANSPORT", name: "Линия ЛРТ / расширение", shortName: "Линия ЛРТ", scope: "DISTRICT", cost: 30, lag: 4, effects: [{ indicator: "T1", value: 16 }, { indicator: "T2", value: 20 }, { indicator: "E2", value: 4 }] },
  { id: "M4", category: "ECOLOGY", name: "Парк / сквер", shortName: "Парк / сквер", scope: "DISTRICT", cost: 15, lag: 2, effects: [{ indicator: "E1", value: 12 }, { indicator: "E2", value: 3 }, { indicator: "B1", value: 2 }] },
  { id: "M5", category: "ECOLOGY", name: "Перевод частного сектора на чистое топливо", shortName: "Чистое топливо", scope: "DISTRICT", cost: 25, lag: 3, effects: [{ indicator: "E2", value: 14 }, { indicator: "C1", value: 4 }] },
  { id: "M6", category: "ECOLOGY", name: "Городская программа озеленения и ветрозащитных полос", shortName: "Зелёный пояс", scope: "CITY", cost: 20, lag: 4, effects: [{ indicator: "E1", value: 5 }, { indicator: "E2", value: 3 }] },
  { id: "M7", category: "SOCIAL", name: "Школа + детсад (модульное строительство)", shortName: "Школа + детсад", scope: "DISTRICT", cost: 24, lag: 3, effects: [{ indicator: "S1", value: 16 }] },
  { id: "M8", category: "SOCIAL", name: "Центр семейного здоровья / поликлиника", shortName: "Поликлиника", scope: "DISTRICT", cost: 20, lag: 3, effects: [{ indicator: "S2", value: 14 }] },
  { id: "M9", category: "SOCIAL", name: "Дворовые спорт-хабы", shortName: "Спорт-хабы", scope: "DISTRICT", cost: 10, lag: 1, effects: [{ indicator: "S1", value: 3 }, { indicator: "S2", value: 3 }, { indicator: "B1", value: 3 }] },
  { id: "M10", category: "SAFETY", name: "Освещение и камеры (расширение Safe City)", shortName: "Safe City", scope: "DISTRICT", cost: 12, lag: 1, effects: [{ indicator: "B1", value: 12 }, { indicator: "B2", value: 2 }] },
  { id: "M11", category: "SAFETY", name: "Безопасные переходы и школьные зоны", shortName: "Безопасные переходы", scope: "DISTRICT", cost: 10, lag: 1, effects: [{ indicator: "B2", value: 12 }, { indicator: "T1", value: -2 }] },
  { id: "M12", category: "SERVICES", name: "Единая цифровая платформа обращений", shortName: "Платформа обращений", scope: "CITY", cost: 14, lag: 1, effects: [{ indicator: "C2", value: 5 }] },
  { id: "M13", category: "SERVICES", name: "Модернизация тепло- и водосетей", shortName: "Модернизация сетей", scope: "DISTRICT", cost: 28, lag: 4, effects: [{ indicator: "C1", value: 18 }, { indicator: "E2", value: 2 }] },
  { id: "M14", category: "SERVICES", name: "Аварийные бригады ЖКХ + раннее оповещение", shortName: "Аварийные бригады", scope: "CITY", cost: 16, lag: 1, effects: [{ indicator: "C1", value: 5 }, { indicator: "C2", value: 2 }] },
] as const;

export function getInitiative(initiativeId: InitiativeId): Initiative {
  const initiative = INITIATIVES.find(({ id }) => id === initiativeId);
  if (!initiative) {
    throw new Error(`Unknown initiative: ${initiativeId}`);
  }
  return initiative;
}
