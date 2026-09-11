export type InspectionVisualKind =
  | "cutting"
  | "shredding"
  | "pressing"
  | "settling"
  | "evaporation"
  | "crystallization"
  | "separation"
  | "drying";

export interface InspectionComponent {
  readonly id: string;
  readonly label: string;
  readonly role: string;
}

export interface InspectionFlow {
  readonly label: string;
  readonly from: string;
  readonly to: string;
  readonly visual: string;
}

export interface EquipmentInspectionDefinition {
  readonly stageId: string;
  readonly equipmentId: string;
  readonly visualKind: InspectionVisualKind;
  readonly cutawayPurpose: string;
  readonly components: readonly InspectionComponent[];
  readonly flows: readonly InspectionFlow[];
}

/**
 * Educational inspection metadata. This describes what the renderer should
 * make visible; it deliberately contains no invented engineering dimensions,
 * capacities, pressures, speeds, or performance claims.
 */
export const sugarcaneEquipmentInspections: readonly EquipmentInspectionDefinition[] = [
  {
    stageId: "preparation",
    equipmentId: "preparation-unit",
    visualKind: "cutting",
    cutawayPurpose: "Show how incoming cane is aligned and reduced into more manageable pieces.",
    components: [
      { id: "feed", label: "Cane feed", role: "Incoming whole cane" },
      { id: "cutter", label: "Cutter / preparation rotor", role: "Reduces and prepares cane" },
      { id: "drive", label: "Drive", role: "Provides mechanical rotation" },
    ],
    flows: [{ label: "Prepared billets", from: "cutter", to: "shredder", visual: "short cane pieces" }],
  },
  {
    stageId: "shredding",
    equipmentId: "shredder",
    visualKind: "shredding",
    cutawayPurpose: "Make the opening of cane structure visually obvious before extraction.",
    components: [
      { id: "feed", label: "Billet feed", role: "Prepared cane" },
      { id: "rotor", label: "Shredding rotor", role: "Opens and tears cane structure" },
      { id: "fiber-bed", label: "Fiber bed", role: "Visible shredded material" },
      { id: "drive", label: "Drive", role: "Provides mechanical rotation" },
    ],
    flows: [{ label: "Opened fiber", from: "rotor", to: "extraction", visual: "loose fibrous cane" }],
  },
  {
    stageId: "extraction",
    equipmentId: "extraction-unit",
    visualKind: "pressing",
    cutawayPurpose: "Show the mechanical nip: shredded cane is compressed, liquid leaves the fiber, and bagasse continues forward.",
    components: [
      { id: "feed-chute", label: "Feed chute", role: "Introduces shredded cane" },
      { id: "roll-1", label: "Top roll", role: "Applies compression" },
      { id: "roll-2", label: "Bottom roll", role: "Supports the compression zone" },
      { id: "roll-3", label: "Feed / pressure roll", role: "Controls material passage through the roll cluster" },
      { id: "juice-pan", label: "Juice pan", role: "Collects expressed juice" },
      { id: "bagasse-chute", label: "Bagasse discharge", role: "Carries pressed fiber onward" },
      { id: "drive", label: "Drive and bearings", role: "Transfers rotation to the roll cluster" },
    ],
    flows: [
      { label: "Juice", from: "roll-1", to: "juice-pan", visual: "green liquid droplets / stream" },
      { label: "Bagasse", from: "roll-3", to: "bagasse-chute", visual: "compressed fibrous mat" },
    ],
  },
  {
    stageId: "clarification",
    equipmentId: "clarifier",
    visualKind: "settling",
    cutawayPurpose: "Show the separation zone, settling solids, rotating rake and clarified-liquid outlet.",
    components: [
      { id: "feed", label: "Raw juice inlet", role: "Receives extracted juice" },
      { id: "settling-zone", label: "Settling zone", role: "Allows suspended solids to separate" },
      { id: "rake", label: "Rake / scraper", role: "Moves settled solids" },
      { id: "solids-zone", label: "Solids collection", role: "Makes the separated solids visible" },
      { id: "outlet", label: "Clarified juice outlet", role: "Carries clarified liquid onward" },
    ],
    flows: [{ label: "Clarified juice", from: "settling-zone", to: "outlet", visual: "cleaner green liquid" }],
  },
  {
    stageId: "evaporation",
    equipmentId: "evaporator",
    visualKind: "evaporation",
    cutawayPurpose: "Show liquid concentration and the distinction between heating/steam space and concentrated syrup.",
    components: [
      { id: "body", label: "Evaporator body", role: "Contains the boiling/concentration space" },
      { id: "heating-surface", label: "Heating surface", role: "Transfers heat to the process liquid" },
      { id: "vapor-space", label: "Vapor space", role: "Makes removed water vapor visible" },
      { id: "syrup-zone", label: "Concentrated liquid zone", role: "Shows the denser syrup" },
      { id: "outlet", label: "Syrup outlet", role: "Feeds the next stage" },
    ],
    flows: [{ label: "Water vapor", from: "vapor-space", to: "outlet", visual: "rising vapor" }],
  },
  {
    stageId: "crystallization",
    equipmentId: "crystallizer",
    visualKind: "crystallization",
    cutawayPurpose: "Show crystal formation inside the mother-liquor-rich vessel rather than presenting it as a generic tank.",
    components: [
      { id: "vessel", label: "Crystallizer vessel", role: "Contains the syrup / magma" },
      { id: "agitator", label: "Agitator", role: "Maintains movement through the vessel" },
      { id: "crystal-zone", label: "Crystal growth zone", role: "Makes growing sugar crystals visible" },
      { id: "outlet", label: "Magma outlet", role: "Feeds the separation stage" },
    ],
    flows: [{ label: "Massecuite", from: "crystal-zone", to: "outlet", visual: "crystals suspended in viscous liquor" }],
  },
  {
    stageId: "centrifugation",
    equipmentId: "centrifuge",
    visualKind: "separation",
    cutawayPurpose: "Show the rotating basket and the visual separation between crystal-rich sugar and mother liquor.",
    components: [
      { id: "feed", label: "Massecuite feed", role: "Introduces crystal-bearing magma" },
      { id: "basket", label: "Perforated basket", role: "Separates phases during rotation" },
      { id: "sugar-zone", label: "Crystal layer", role: "Retains separated sugar crystals" },
      { id: "liquor-zone", label: "Mother-liquor path", role: "Shows separated molasses-rich liquid" },
      { id: "drive", label: "Drive", role: "Rotates the basket" },
    ],
    flows: [
      { label: "Sugar", from: "basket", to: "sugar-zone", visual: "light crystal layer" },
      { label: "Molasses", from: "basket", to: "liquor-zone", visual: "dark liquid" },
    ],
  },
  {
    stageId: "drying",
    equipmentId: "dryer",
    visualKind: "drying",
    cutawayPurpose: "Show wet sugar entering a rotating drying zone and moisture leaving with the air stream.",
    components: [
      { id: "feed", label: "Wet sugar feed", role: "Receives centrifuge product" },
      { id: "drum", label: "Drying drum", role: "Moves and exposes sugar to drying air" },
      { id: "air-path", label: "Air path", role: "Carries moisture away" },
      { id: "sugar-bed", label: "Sugar bed", role: "Visible moving product" },
      { id: "outlet", label: "Dry sugar outlet", role: "Final product discharge" },
    ],
    flows: [{ label: "Dry sugar", from: "sugar-bed", to: "outlet", visual: "lighter, free-flowing crystals" }],
  },
] as const;

export function getEquipmentInspection(stageId: string): EquipmentInspectionDefinition | undefined {
  return sugarcaneEquipmentInspections.find((inspection) => inspection.stageId === stageId);
}
