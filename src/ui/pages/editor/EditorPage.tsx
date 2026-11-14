import type { ComponentType } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { items, useLibrary } from '../../../bindings';
import { KIND_LABELS } from '../../../core/labels';
import { itemName } from '../../../core/library';
import { type ItemKind, isItemKind } from '../../../core/models';
import { Loading, Missing } from '../../components/common';
import { itemPath, listPath, NEW_ITEM_ID, ROUTES } from '../../routes';
import { ConceptForm } from './ConceptForm';
import { PositionForm } from './PositionForm';
import type { ItemFormProps } from './shared';
import { TransitionForm } from './TransitionForm';

/** One form per kind of item. Supporting a new kind means adding a form here, not editing the others. */
const FORMS: Record<ItemKind, ComponentType<ItemFormProps>> = {
  concept: ConceptForm,
  position: PositionForm,
  transition: TransitionForm,
};

/** Create or edit any item. Owns routing, loading and deletion; the form for each kind owns its fields. */
export default function EditorPage() {
  const { kind, id = NEW_ITEM_ID } = useParams();
  const navigate = useNavigate();
  const library = useLibrary();

  if (!isItemKind(kind)) return <Missing what="Page" back={{ to: ROUTES.home, label: 'Home' }} />;
  if (!library) return <Loading />;

  const itemId = id === NEW_ITEM_ID ? null : id;
  const existingName = itemId ? itemName(library, kind, itemId) : null;
  const label = KIND_LABELS[kind].toLowerCase();
  if (itemId && existingName === null) {
    return <Missing what={KIND_LABELS[kind]} back={{ to: listPath(kind), label: 'Back' }} />;
  }

  const cancelTo = itemId ? itemPath(kind, itemId) : listPath(kind);
  const remove = async () => {
    if (!itemId || !confirm(`Delete "${existingName}"?`)) return;
    await items.deleteItem(kind, itemId);
    navigate(listPath(kind));
  };
  const Form = FORMS[kind];

  return (
    <div className="stack narrow-page">
      <Link to={cancelTo} className="small">
        ← Cancel
      </Link>
      <h1>{itemId ? `Edit ${label}` : `New ${label}`}</h1>
      <Form
        // Remount when switching item so each form starts from that item's values.
        key={`${kind}:${id}`}
        itemId={itemId}
        library={library}
        cancelTo={cancelTo}
        onSaved={(savedId) => navigate(itemPath(kind, savedId))}
        onDelete={itemId ? remove : undefined}
      />
    </div>
  );
}
