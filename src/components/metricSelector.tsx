"use client";

import type { ComponentType, SVGProps } from "react";
import { useState } from "react";

// outline icons
import {
    BoltIcon as BoltOutline,
    LightBulbIcon as BulbOutline,
    CurrencyDollarIcon as DollarOutline,
} from "@heroicons/react/24/outline";

// solid icons
import {
    BoltIcon as BoltSolid,
    LightBulbIcon as BulbSolid,
    CurrencyDollarIcon as DollarSolid,
} from "@heroicons/react/24/solid";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;
type Card = {
  label: string;
  Outline: HeroIcon;
  Solid: HeroIcon;
};

const cards: Card[] = [
  { label: "Intelligence", Outline: BulbOutline, Solid: BulbSolid },
  { label: "Speed", Outline: BoltOutline, Solid: BoltSolid },
  { label: "Price", Outline: DollarOutline, Solid: DollarSolid },
];

export default function MetricSelector() {
  const [selected, setSelected] = useState<number>(2); // default “Price”

  return (
    <div className="flex flex-col justify-center space-y-4">
      <p className="text-md">What do you want to optimize?</p>
      <div className="flex space-x-4">
        {cards.map((c, i) => {
          const isActive = i === selected;
          const Icon = isActive ? c.Solid : c.Outline;

          return (
            <div
              key={c.label}
              onClick={() => setSelected(i)}
              className={`
                card cursor-pointer border-2 flex-1 p-2 flex flex-col items-center text-base-content
                ${isActive ? "border-primary-content" : "border-base-300"}
                shadow-sm transition
              `}
            >
              {/* Label */}
              <p className="text-sm font-medium mb-2">{c.label}</p>

              {/* Icon */}
              <Icon
                className={`w-6 h-6 mb-2 transition-colors
                  ${isActive ? "text-primary-content" : "text-base-content"}
                `}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
