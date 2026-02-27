import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Pressable, Platform } from 'react-native';
import Svg, {
  Polygon,
  G,
  Circle,
  Rect,
  Line,
  Defs,
  RadialGradient,
  Stop,
  Ellipse,
} from 'react-native-svg';
import { useGame } from '@/contexts/GameContext';
import { useMarket } from '@/contexts/MarketContext';
import Colors from '@/constants/colors';

// ─── Isometric projection ────────────────────────────────────────────────────
const TW = 60;
const TH = 30;
const WH = 40;

// ViewBox: '-130 -160 360 330'
const VB_X = -130, VB_Y = -160, VB_W = 360, VB_H = 330;
const SVG_H = 240;

function isoXY(col: number, row: number, elev = 0) {
  return {
    x: (col - row) * (TW / 2),
    y: (col + row) * (TH / 2) - elev * WH,
  };
}

function poly(...pts: { x: number; y: number }[]) {
  return pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

function boxCorners(c: number, r: number, h: number) {
  return {
    Ng: isoXY(c, r, 0),
    Eg: isoXY(c + 1, r, 0),
    Sg: isoXY(c + 1, r + 1, 0),
    Wg: isoXY(c, r + 1, 0),
    Nt: isoXY(c, r, h),
    Et: isoXY(c + 1, r, h),
    St: isoXY(c + 1, r + 1, h),
    Wt: isoXY(c, r + 1, h),
  };
}

// Convert SVG coordinates to screen % for overlay positioning
function svgToScreen(svgX: number, svgY: number, containerW: number) {
  const screenX = ((svgX - VB_X) / VB_W) * containerW;
  const screenY = ((svgY - VB_Y) / VB_H) * SVG_H;
  return { screenX, screenY };
}

// ─── Ground tile ─────────────────────────────────────────────────────────────
function GroundTile({ c, r, color = '#111928' }: { c: number; r: number; color?: string }) {
  const { Ng, Eg, Sg, Wg } = boxCorners(c, r, 0);
  return <Polygon points={poly(Ng, Eg, Sg, Wg)} fill={color} stroke="#1A2238" strokeWidth={0.5} />;
}

// ─── Empty slot ───────────────────────────────────────────────────────────────
function EmptySlot({ c, r }: { c: number; r: number }) {
  const { Ng, Eg, Sg, Wg } = boxCorners(c, r, 0);
  return (
    <Polygon
      points={poly(Ng, Eg, Sg, Wg)}
      fill="none"
      stroke="#1E2844"
      strokeWidth={0.8}
      strokeDasharray="4,3"
    />
  );
}

// ─── IsoBox (pure SVG, no touch) ──────────────────────────────────────────────
function IsoBox({ c, r, h, topColor, leftColor, rightColor, children }: {
  c: number; r: number; h: number;
  topColor: string; leftColor: string; rightColor: string;
  children?: React.ReactNode;
}) {
  const { Ng, Eg, Sg, Wg, Nt, Et, St, Wt } = boxCorners(c, r, h);
  return (
    <G>
      <Polygon points={poly(Wt, St, Sg, Wg)} fill={leftColor} />
      <Polygon points={poly(Et, St, Sg, Eg)} fill={rightColor} />
      <Polygon points={poly(Nt, Et, St, Wt)} fill={topColor} />
      {children}
    </G>
  );
}

// ─── Mining Rig ───────────────────────────────────────────────────────────────
function MiningRigBuilding({ c, r, overheated }: { c: number; r: number; overheated: boolean }) {
  const { Nt, Et, St, Wt, Sg, Wg } = boxCorners(c, r, 1.6);
  const topColor = overheated ? '#2A1508' : '#1A2232';
  const leftColor = overheated ? '#1E0E04' : '#101828';
  const rightColor = overheated ? '#160B02' : '#0A1220';
  const ledColor = overheated ? Colors.accentRed : Colors.accentGreen;

  return (
    <IsoBox c={c} r={r} h={1.6} topColor={topColor} leftColor={leftColor} rightColor={rightColor}>
      {[0, 1, 2].map(i => (
        <Line
          key={`led_${i}`}
          x1={Wt.x + (St.x - Wt.x) * 0.15}
          y1={Wt.y + (St.y - Wt.y) * 0.15 + (Sg.y - Wg.y) * (0.2 + i * 0.22)}
          x2={Wt.x + (St.x - Wt.x) * 0.85}
          y2={Wt.y + (St.y - Wt.y) * 0.85 + (Sg.y - Wg.y) * (0.2 + i * 0.22)}
          stroke={ledColor}
          strokeWidth={1.2}
          strokeOpacity={0.7}
        />
      ))}
      {[0, 1, 2].map(i => (
        <Circle
          key={`dot_${i}`}
          cx={Wt.x + (St.x - Wt.x) * 0.82}
          cy={Wt.y + (St.y - Wt.y) * 0.82 + (Sg.y - Wg.y) * (0.2 + i * 0.22)}
          r={2.2}
          fill={ledColor}
          fillOpacity={0.9}
        />
      ))}
      <Line
        x1={(Nt.x + St.x) / 2} y1={(Nt.y + St.y) / 2}
        x2={(Nt.x + St.x) / 2} y2={(Nt.y + St.y) / 2 - 10}
        stroke={ledColor} strokeWidth={1} strokeOpacity={0.7}
      />
      <Circle
        cx={(Nt.x + St.x) / 2} cy={(Nt.y + St.y) / 2 - 10}
        r={1.5} fill={ledColor} fillOpacity={0.8}
      />
    </IsoBox>
  );
}

// ─── Power Plant ──────────────────────────────────────────────────────────────
function PowerPlantBuilding({ c, r }: { c: number; r: number }) {
  const { Nt, Et } = boxCorners(c, r, 2.2);
  const topCx = (Nt.x + Et.x) / 2;
  const topCy = (Nt.y + Et.y) / 2;
  return (
    <IsoBox c={c} r={r} h={2.2} topColor="#16223A" leftColor="#0C1829" rightColor="#081020">
      <Ellipse cx={topCx} cy={topCy - 4} rx={TW * 0.18} ry={TH * 0.22}
        fill="#1A3050" stroke={Colors.accent} strokeWidth={0.8} />
      <Circle cx={topCx} cy={topCy - 4} r={3} fill={Colors.accent} fillOpacity={0.8} />
    </IsoBox>
  );
}

// ─── Cooling Hub ──────────────────────────────────────────────────────────────
function CoolingHubBuilding({ c, r }: { c: number; r: number }) {
  const { Nt, Et } = boxCorners(c, r, 1.8);
  const topCx = (Nt.x + Et.x) / 2;
  const topCy = (Nt.y + Et.y) / 2;
  return (
    <IsoBox c={c} r={r} h={1.8} topColor="#0E2222" leftColor="#081818" rightColor="#051212">
      <Circle cx={topCx} cy={topCy - 2} r={TW * 0.22}
        fill="none" stroke={Colors.accentGreen} strokeWidth={1} strokeOpacity={0.5} />
      {[0, 90, 180, 270].map(deg => {
        const rad = (deg * Math.PI) / 180;
        const r2 = TW * 0.18;
        return (
          <Line
            key={deg}
            x1={topCx.toFixed(1)} y1={(topCy - 2).toFixed(1)}
            x2={(topCx + Math.cos(rad) * r2).toFixed(1)}
            y2={(topCy - 2 + Math.sin(rad) * r2 * 0.5).toFixed(1)}
            stroke={Colors.accentGreen} strokeWidth={1.5} strokeOpacity={0.7}
          />
        );
      })}
      <Circle cx={topCx} cy={topCy - 2} r={3} fill={Colors.accentGreen} fillOpacity={0.8} />
    </IsoBox>
  );
}

// ─── Maintenance Bay ──────────────────────────────────────────────────────────
function MaintenanceBayBuilding({ c, r }: { c: number; r: number }) {
  return <IsoBox c={c} r={r} h={1.2} topColor="#1E1A2E" leftColor="#141020" rightColor="#0E0C18" />;
}

// ─── Security Office ──────────────────────────────────────────────────────────
function SecurityOfficeBuilding({ c, r }: { c: number; r: number }) {
  const { Nt, Et } = boxCorners(c, r, 1.4);
  const topCx = (Nt.x + Et.x) / 2;
  const topCy = (Nt.y + Et.y) / 2;
  return (
    <IsoBox c={c} r={r} h={1.4} topColor="#1E1228" leftColor="#140C1E" rightColor="#0E0814">
      <Circle cx={topCx} cy={topCy - 2} r={4} fill={Colors.accentPurple} fillOpacity={0.7} />
    </IsoBox>
  );
}

// ─── Building slots ───────────────────────────────────────────────────────────
const MINING_SLOTS = [
  [1, 2], [2, 2], [3, 2],
  [1, 3], [2, 3], [3, 3],
  [1, 4], [2, 4], [3, 4],
];
const POWER_SLOTS = [[-1, 2], [-1, 3], [-1, 4]];
const COOL_SLOTS = [[1, 0], [2, 0], [3, 0]];
const MAINT_SLOTS = [[4, 2], [4, 3]];
const SEC_SLOTS = [[4, 0], [4, 1]];

// Hit zones: each building type has a primary tap zone
type HitZone = { type: string; c: number; r: number; h: number };

// ─── Main component ───────────────────────────────────────────────────────────
interface IsometricDistrictProps {
  onBuildingPress: (type: string) => void;
  containerWidth?: number;
}

export function IsometricDistrict({ onBuildingPress, containerWidth = 360 }: IsometricDistrictProps) {
  const { game, powerUsed, powerCapacity } = useGame();
  const { market } = useMarket();

  const overheated = game.wearLevel > 60 || (powerCapacity > 0 && powerUsed / powerCapacity > 0.9);
  const viewBox = `${VB_X} ${VB_Y} ${VB_W} ${VB_H}`;

  // Compute overlay hit zones for each installed building
  const hitZones = useMemo<HitZone[]>(() => {
    const zones: HitZone[] = [];
    MINING_SLOTS.forEach(([c, r], i) => {
      if (i < game.miningRigs) zones.push({ type: 'miningRig', c, r, h: 1.6 });
    });
    POWER_SLOTS.forEach(([c, r], i) => {
      if (i < game.powerPlants - 2) zones.push({ type: 'powerPlant', c, r, h: 2.2 });
    });
    COOL_SLOTS.forEach(([c, r], i) => {
      if (i < game.coolingHubs - 2) zones.push({ type: 'coolingHub', c, r, h: 1.8 });
    });
    MAINT_SLOTS.forEach(([c, r], i) => {
      if (i < game.maintenanceBays) zones.push({ type: 'maintenanceBay', c, r, h: 1.2 });
    });
    SEC_SLOTS.forEach(([c, r], i) => {
      if (i < game.securityOffices) zones.push({ type: 'securityOffice', c, r, h: 1.4 });
    });
    return zones;
  }, [game.miningRigs, game.powerPlants, game.coolingHubs, game.maintenanceBays, game.securityOffices]);

  // Build render list for SVG (painter's algorithm: back-to-front)
  const renderItems = useMemo(() => {
    type Item =
      | { kind: 'ground'; c: number; r: number }
      | { kind: 'empty'; c: number; r: number }
      | { kind: 'mining_rig'; c: number; r: number }
      | { kind: 'power_plant'; c: number; r: number }
      | { kind: 'cooling_hub'; c: number; r: number }
      | { kind: 'maint'; c: number; r: number }
      | { kind: 'sec'; c: number; r: number };

    const all: Item[] = [];

    for (let c = -1; c <= 5; c++) {
      for (let r = -1; r <= 5; r++) {
        all.push({ kind: 'ground', c, r });
      }
    }

    MINING_SLOTS.forEach(([c, r], i) => {
      all.push(i < game.miningRigs ? { kind: 'mining_rig', c, r } : { kind: 'empty', c, r });
    });
    POWER_SLOTS.forEach(([c, r], i) => {
      if (i < game.powerPlants - 2) all.push({ kind: 'power_plant', c, r });
      else if (i === 0) all.push({ kind: 'empty', c, r });
    });
    COOL_SLOTS.forEach(([c, r], i) => {
      if (i < game.coolingHubs - 2) all.push({ kind: 'cooling_hub', c, r });
      else if (i === 0) all.push({ kind: 'empty', c, r });
    });
    MAINT_SLOTS.forEach(([c, r], i) => {
      if (i < game.maintenanceBays) all.push({ kind: 'maint', c, r });
    });
    SEC_SLOTS.forEach(([c, r], i) => {
      if (i < game.securityOffices) all.push({ kind: 'sec', c, r });
    });

    all.sort((a, b) => {
      const aG = a.kind === 'ground', bG = b.kind === 'ground';
      if (aG && !bG) return -1;
      if (!aG && bG) return 1;
      return (a.c + a.r) - (b.c + b.r);
    });

    return all;
  }, [game.miningRigs, game.powerPlants, game.coolingHubs, game.maintenanceBays, game.securityOffices]);

  return (
    <View style={styles.container}>
      {/* Pure SVG — no touch handlers on SVG elements */}
      <Svg width="100%" height="100%" viewBox={viewBox}>
        <Defs>
          <RadialGradient id="heatGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={Colors.accentRed} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={Colors.accentRed} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {renderItems.map((item, idx) => {
          const key = `${item.kind}_${item.c}_${item.r}`;
          switch (item.kind) {
            case 'ground': {
              const isRig = MINING_SLOTS.some(([mc, mr]) => mc === item.c && mr === item.r);
              const isPwr = POWER_SLOTS.some(([mc, mr]) => mc === item.c && mr === item.r);
              const isCool = COOL_SLOTS.some(([mc, mr]) => mc === item.c && mr === item.r);
              return <GroundTile key={key} c={item.c} r={item.r}
                color={isRig ? '#0E1520' : isPwr ? '#0A1018' : isCool ? '#0A1612' : '#0C0F18'} />;
            }
            case 'empty':
              return <EmptySlot key={key} c={item.c} r={item.r} />;
            case 'mining_rig':
              return <MiningRigBuilding key={key} c={item.c} r={item.r} overheated={overheated} />;
            case 'power_plant':
              return <PowerPlantBuilding key={key} c={item.c} r={item.r} />;
            case 'cooling_hub':
              return <CoolingHubBuilding key={key} c={item.c} r={item.r} />;
            case 'maint':
              return <MaintenanceBayBuilding key={key} c={item.c} r={item.r} />;
            case 'sec':
              return <SecurityOfficeBuilding key={key} c={item.c} r={item.r} />;
            default:
              return null;
          }
        })}

        {overheated && <Circle cx="70" cy="60" r="130" fill="url(#heatGlow)" />}
      </Svg>

      {/* Pressable hit zones as absolute overlay */}
      {hitZones.map(zone => {
        const iso = isoXY(zone.c + 0.5, zone.r + 0.5, zone.h * 0.5);
        const { screenX, screenY } = svgToScreen(iso.x, iso.y, containerWidth);
        const HIT_W = 44;
        const HIT_H = 34;
        return (
          <Pressable
            key={`hit_${zone.type}_${zone.c}_${zone.r}`}
            onPress={() => onBuildingPress(zone.type)}
            style={[
              styles.hitZone,
              { left: screenX - HIT_W / 2, top: screenY - HIT_H / 2, width: HIT_W, height: HIT_H },
            ]}
          />
        );
      })}

      {/* Status bar */}
      <View style={styles.districtLabel} pointerEvents="none">
        <View style={[styles.labelDot, { backgroundColor: market.regime === 'crash' ? Colors.accentRed : Colors.accentGreen }]} />
        <Text style={styles.labelText}>
          {game.miningRigs} Rigs · {game.powerPlants - 2 + game.coolingHubs - 2} Infra
        </Text>
      </View>

      {game.miningRigs === 0 && (
        <View style={styles.tapHint} pointerEvents="none">
          <Text style={styles.tapHintText}>Build rigs to grow your district</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: SVG_H,
    backgroundColor: '#080B12',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hitZone: {
    position: 'absolute',
    borderRadius: 8,
  },
  districtLabel: {
    position: 'absolute',
    bottom: 10,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  labelText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: Colors.textMuted,
  },
  tapHint: {
    position: 'absolute',
    bottom: 10,
    right: 14,
  },
  tapHintText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
  },
});
