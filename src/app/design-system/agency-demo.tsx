"use client";

import * as React from "react";
import { ChoiceGroup } from "@/components/choice-group";
import { DeclarationReceipt } from "@/components/declaration-receipt";
import { Button } from "@/components/ui/button";
import {
  COUNTERPARTY_COPY,
  COUNTERPARTY_ORDER,
  HORIZON_COPY,
  HORIZON_ORDER,
} from "@/lib/domain/declaration";
import type { Counterparty, Declaration, Horizon } from "@/lib/domain/types";

const HORIZONS = HORIZON_ORDER.map((h) => ({
  value: h,
  label: HORIZON_COPY[h].label,
  consequence: HORIZON_COPY[h].consequence,
}));

const COUNTERPARTIES = COUNTERPARTY_ORDER.map((c) => ({
  value: c,
  label: COUNTERPARTY_COPY[c].label,
  consequence: COUNTERPARTY_COPY[c].why,
}));

/**
 * The three Agency levers wired together, so the gallery shows the behaviour
 * rather than a still of it: the assumption before anything is declared, the
 * choice staying visible after it is made, and the undo.
 */
export function AgencyDemo() {
  const [horizon, setHorizon] = React.useState<Horizon | null>(null);
  const [counterparty, setCounterparty] = React.useState<Counterparty | null>(
    null,
  );
  const [editing, setEditing] = React.useState(true);

  const declaration: Declaration | null =
    horizon && counterparty
      ? { horizon, counterparty, declaredAt: "2026-09-06" }
      : null;

  return (
    <div className="flex flex-col gap-5">
      <DeclarationReceipt
        declaration={declaration}
        onChange={
          declaration && !editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Change what you told us
            </Button>
          ) : null
        }
      />

      {editing ? (
        <div className="flex flex-col gap-6 rounded-lg border border-hairline p-5">
          <ChoiceGroup
            legend="How fast is the clock, actually?"
            choices={HORIZONS}
            value={horizon}
            onChange={setHorizon}
            onClear={() => setHorizon(null)}
          />
          <ChoiceGroup
            legend="Who does this number have to convince?"
            choices={COUNTERPARTIES}
            value={counterparty}
            onChange={setCounterparty}
            onClear={() => setCounterparty(null)}
          />
          {declaration ? (
            <Button className="w-fit" onClick={() => setEditing(false)}>
              That is right
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
