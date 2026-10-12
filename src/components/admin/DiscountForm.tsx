import { saveDiscountAction } from "@/app/admin/discounts/actions";
import { dateInput } from "@/lib/admin/format";
import { ActionForm, FormStatus, SubmitButton } from "./ActionForm";
import { Checkbox, SelectField, TextField } from "./fields";
import { btnDark } from "./styles";

type Discount = {
  id: string;
  code: string;
  type: string;
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
};

export function DiscountForm({ discount }: { discount?: Discount }) {
  return (
    <ActionForm action={saveDiscountAction} resetOnSuccess={!discount} className="grid gap-4 p-4 sm:grid-cols-2" aria-label={discount ? "Edit discount code" : "New discount code"}>
      {discount ? <input type="hidden" name="id" value={discount.id} /> : null}
      <TextField label="Code" name="code" required defaultValue={discount?.code ?? ""} placeholder="WELCOME10" hint="Saved in UPPERCASE; must be unique" maxLength={32} />
      <SelectField
        label="Type"
        name="type"
        defaultValue={discount?.type ?? "PERCENT"}
        options={[
          { value: "PERCENT", label: "Percent off" },
          { value: "FIXED", label: "Fixed amount (UZS)" },
        ]}
      />
      <TextField label="Value" name="value" type="number" min={1} step={1} required defaultValue={discount?.value ?? ""} hint="1–100 for percent, or an amount in UZS" />
      <TextField label="Minimum subtotal (UZS)" name="minSubtotal" type="number" min={0} step={1} defaultValue={discount?.minSubtotal ?? 0} />
      <TextField label="Max uses" name="maxUses" type="number" min={1} step={1} defaultValue={discount?.maxUses ?? ""} hint="Leave empty for unlimited" />
      <div className="flex items-end pb-2">
        <Checkbox label="Active" name="active" defaultChecked={discount?.active ?? true} />
      </div>
      <TextField label="Starts" name="startsAt" type="date" defaultValue={dateInput(discount?.startsAt)} hint="Optional (Tashkent time)" />
      <TextField label="Ends" name="endsAt" type="date" defaultValue={dateInput(discount?.endsAt)} hint="Optional, inclusive" />
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <SubmitButton className={btnDark} pendingText="Saving…">{discount ? "Save code" : "Create code"}</SubmitButton>
        <FormStatus />
      </div>
    </ActionForm>
  );
}
