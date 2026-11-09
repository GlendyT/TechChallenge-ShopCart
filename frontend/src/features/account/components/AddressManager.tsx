import { useState, type FormEvent } from "react";
import { LoaderCircle, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import type { Address, AddressInput } from "../types/accountTypes";
import { useAddressMutations } from "../hooks/useAddresses";

const emptyAddress: AddressInput = { nombreDestinatario: "", telefonoContacto: "", direccionLinea1: "", direccionLinea2: "", ciudad: "", departamento: "", codigoPostal: "", esPrincipal: false };

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(emptyAddress);
  const mutations = useAddressMutations();
  const saving = mutations.create.isPending || mutations.update.isPending;

  function openForm(address?: Address) {
    setEditing(address ?? null);
    setForm(address ? {
      nombreDestinatario: address.NombreDestinatario,
      telefonoContacto: address.TelefonoContacto ?? "",
      direccionLinea1: address.DireccionLinea1,
      direccionLinea2: address.DireccionLinea2 ?? "",
      ciudad: address.Ciudad,
      departamento: address.Departamento,
      codigoPostal: address.CodigoPostal ?? "",
      esPrincipal: address.EsPrincipal,
    } : emptyAddress);
    mutations.create.reset(); mutations.update.reset();
    setFormOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { ...form, nombreDestinatario: form.nombreDestinatario.trim(), telefonoContacto: form.telefonoContacto.trim(), direccionLinea1: form.direccionLinea1.trim(), direccionLinea2: form.direccionLinea2?.trim() || null, ciudad: form.ciudad.trim(), departamento: form.departamento.trim(), codigoPostal: form.codigoPostal?.trim() || null };
    try {
      if (editing) await mutations.update.mutateAsync({ id: editing.IDDireccion, address: input });
      else await mutations.create.mutateAsync(input);
      setFormOpen(false);
    } catch { /* El error del servidor queda visible en el formulario. */ }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try { await mutations.remove.mutateAsync(deleteTarget.IDDireccion); setDeleteTarget(null); }
    catch { /* El error queda visible en la confirmación. */ }
  }

  return <>
    <div className="mb-4 flex justify-end"><Button size="sm" type="button" onClick={() => openForm()}><Plus size={14} /> Agregar dirección</Button></div>
    {addresses.length === 0 ? <p className="text-sm text-dn-gris">Todavía no tienes direcciones guardadas.</p> : <div className="divide-y divide-dn-gris/20">{addresses.map((address) => <article className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0" key={address.IDDireccion}><div className="flex min-w-0 gap-3"><MapPin className="mt-0.5 shrink-0 text-dn-azul" size={16} aria-hidden="true" /><div><strong className="text-sm text-dn-gris-oscuro">{address.NombreDestinatario}{address.EsPrincipal ? " · Principal" : ""}</strong><span className="mt-1 block text-xs leading-5 text-dn-gris">{address.DireccionLinea1}{address.DireccionLinea2 ? `, ${address.DireccionLinea2}` : ""}<br />{address.Ciudad}, {address.Departamento}{address.CodigoPostal ? ` · ${address.CodigoPostal}` : ""}</span><span className="mt-1 block text-xs text-dn-gris/80">{address.TelefonoContacto}</span></div></div><div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" aria-label={`Editar dirección de ${address.NombreDestinatario}`} onClick={() => openForm(address)}><Pencil size={15} /></Button><Button size="icon" variant="ghost" aria-label={`Eliminar dirección de ${address.NombreDestinatario}`} onClick={() => { setDeleteTarget(address); mutations.remove.reset(); }}><Trash2 size={15} className="text-dn-rojo" /></Button></div></article>)}</div>}

    <Dialog open={formOpen} onOpenChange={(open) => { if (!open && !saving) setFormOpen(false); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Editar dirección" : "Agregar dirección"}</DialogTitle><DialogDescription>Completa los datos para la entrega de tus pedidos.</DialogDescription></DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="address-recipient">Nombre del destinatario</Label><Input id="address-recipient" minLength={2} maxLength={150} value={form.nombreDestinatario} onChange={(event) => setForm((current) => ({ ...current, nombreDestinatario: event.target.value }))} required /></div>
          <div className="space-y-1.5"><Label htmlFor="address-phone">Teléfono</Label><Input id="address-phone" minLength={7} maxLength={20} value={form.telefonoContacto} onChange={(event) => setForm((current) => ({ ...current, telefonoContacto: event.target.value }))} required /></div>
          <div className="space-y-1.5"><Label htmlFor="address-postal">Código postal</Label><Input id="address-postal" maxLength={10} value={form.codigoPostal ?? ""} onChange={(event) => setForm((current) => ({ ...current, codigoPostal: event.target.value }))} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="address-line1">Dirección</Label><Textarea id="address-line1" minLength={5} maxLength={200} value={form.direccionLinea1} onChange={(event) => setForm((current) => ({ ...current, direccionLinea1: event.target.value }))} required /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="address-line2">Complemento (opcional)</Label><Input id="address-line2" maxLength={200} value={form.direccionLinea2 ?? ""} onChange={(event) => setForm((current) => ({ ...current, direccionLinea2: event.target.value }))} /></div>
          <div className="space-y-1.5"><Label htmlFor="address-city">Ciudad</Label><Input id="address-city" minLength={2} maxLength={100} value={form.ciudad} onChange={(event) => setForm((current) => ({ ...current, ciudad: event.target.value }))} required /></div>
          <div className="space-y-1.5"><Label htmlFor="address-department">Departamento</Label><Input id="address-department" minLength={2} maxLength={100} value={form.departamento} onChange={(event) => setForm((current) => ({ ...current, departamento: event.target.value }))} required /></div>
          <label className="flex items-center gap-2 text-sm text-dn-gris-oscuro sm:col-span-2"><input className="size-4 accent-dn-azul" type="checkbox" checked={form.esPrincipal} onChange={(event) => setForm((current) => ({ ...current, esPrincipal: event.target.checked }))} />Marcar como dirección principal</label>
          {(mutations.create.error || mutations.update.error) && <p className="text-sm text-dn-rojo sm:col-span-2" role="alert">{(mutations.create.error ?? mutations.update.error)?.message}</p>}
          <DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving}>{saving && <LoaderCircle size={15} className="animate-spin" />}Guardar dirección</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !mutations.remove.isPending) setDeleteTarget(null); }}>
      <DialogContent><DialogHeader><DialogTitle>Eliminar dirección</DialogTitle><DialogDescription>¿Eliminar la dirección de {deleteTarget?.NombreDestinatario}? Esta acción no se puede deshacer.</DialogDescription></DialogHeader>{mutations.remove.error && <p className="text-sm text-dn-rojo" role="alert">{mutations.remove.error.message}</p>}<DialogFooter><Button type="button" variant="outline" disabled={mutations.remove.isPending} onClick={() => setDeleteTarget(null)}>Conservar</Button><Button type="button" variant="destructive" disabled={mutations.remove.isPending} onClick={() => void confirmDelete()}>{mutations.remove.isPending && <LoaderCircle size={15} className="animate-spin" />}Eliminar</Button></DialogFooter></DialogContent>
    </Dialog>
  </>;
}
