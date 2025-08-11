"use client";

import type { UserPreference } from "@/store/router";
import { useRouterStore } from "@/store/router"; // <-- zustand store
import type { ComponentType, SVGProps } from "react";

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
  label: "Intelligence" | "Speed" | "Price";
  pref: UserPreference;
  Outline: HeroIcon;
  Solid: HeroIcon;
};

const cards: Card[] = [
  {
    label: "Intelligence",
    pref: "intelligence",
    Outline: BulbOutline,
    Solid: BulbSolid,
  },
  { label: "Speed", pref: "speed", Outline: BoltOutline, Solid: BoltSolid },
  { label: "Price", pref: "price", Outline: DollarOutline, Solid: DollarSolid },
];

export default function MetricSelector() {
  const pref = useRouterStore(s => s.userPreference);
  const setPref = useRouterStore(s => s.setUserPreference);

  return (
    <div className="flex flex-col justify-center space-y-4">
      <p className="text-md px-2 font-bold">
        What do you want to optimize for?
      </p>
      <div className="flex space-x-4">
        {cards.map(card => {
          const isActive = card.pref === pref;
          const Icon = isActive ? card.Solid : card.Outline;

          return (
            <button
              key={card.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => setPref(card.pref)}
              className={`
                card cursor-pointer flex-1 p-2 flex flex-col items-center text-base-content
                ${isActive ? "bg-base-300" : "bg-base-200"}
                shadow-md transition
              `}
            >
              <p
                className={`text-sm my-2
                ${isActive ? "font-bold" : "font-normal"}`}
              >
                {card.label}
              </p>
              <Icon
                className={`w-6 h-6 mb-2 transition-colors
                  ${isActive ? "text-neutral" : "text-base-content"}
                `}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
