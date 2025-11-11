import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import NeonTextField from "@/components/NeonTextField";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import PrimaryButton from "@/components/PrimaryButton";
import {
  useBankStore,
  Contact,
  ContactDraft,
} from "@/store/useBankStore";
import { palette } from "@/theme/colors";
import { formatPhoneNumber, sanitizePhoneInput, PHONE_REQUIRED_LENGTH } from "@/utils/phone";

const ContactFormModal = ({
  visible,
  onClose,
  onSubmit,
  form,
  setForm,
  error,
  editing,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: ContactDraft;
  setForm: Dispatch<SetStateAction<ContactDraft>>;
  error: string | null;
  editing: boolean;
}) => {
  const formattedPhone = useMemo(
    () => formatPhoneNumber(form.phone),
    [form.phone],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalDismissArea} />
        </TouchableWithoutFeedback>
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 220 }}
          style={styles.modalCard}
        >
          <Text style={styles.modalTitle}>
            {editing ? "Editar contacto" : "Nuevo contacto"}
          </Text>
          <NeonTextField
            label="Nombre"
            placeholder="Ej. Ana Gómez"
            value={form.name}
            onChangeText={(value) => setForm({ ...form, name: value })}
            icon={
              <MaterialCommunityIcons
                name="account"
                size={20}
                color={palette.accentCyan}
              />
            }
          />
          <NeonTextField
            label="Teléfono"
            placeholder="0000 0000"
            value={formattedPhone}
            onChangeText={(value) => {
              const sanitized = sanitizePhoneInput(value);
              setForm((prev) => ({ ...prev, phone: sanitized }));
            }}
            keyboardType="phone-pad"
            allowOnlyNumeric
            icon={
              <MaterialCommunityIcons
                name="phone"
                size={20}
                color={palette.accentCyan}
              />
            }
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.modalSecondaryButton}>
              <Text style={styles.modalSecondaryLabel}>Cancelar</Text>
            </Pressable>
            <PrimaryButton
              label={editing ? "Guardar" : "Crear"}
              onPress={onSubmit}
            />
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

type ContactCardProps = {
  contact: Contact;
  onToggleFavorite: () => void;
  onTransfer: () => void;
  onEdit: () => void;
  onRemove: () => void;
};

const ContactCard = ({
  contact,
  onToggleFavorite,
  onTransfer,
  onEdit,
  onRemove,
}: ContactCardProps) => {
  const actions = [
    {
      key: "send",
      icon: "send",
      label: "Enviar",
      onPress: onTransfer,
      buttonStyle: styles.contactActionPrimary,
      labelStyle: styles.contactActionLabelPrimary,
      iconColor: palette.textPrimary,
    },
    {
      key: "edit",
      icon: "pencil",
      label: "Editar",
      onPress: onEdit,
      iconColor: palette.textSecondary,
    },
    {
      key: "delete",
      icon: "delete",
      label: "Eliminar",
      onPress: onRemove,
      buttonStyle: styles.contactActionDanger,
      labelStyle: styles.contactActionLabelDanger,
      iconColor: palette.danger,
    },
  ];

  return (
    <GlassCard intensity={26} padding={0}>
      <View style={styles.contactCard}>
        <View style={styles.contactInfoRow}>
          <View
            style={[
              styles.contactAvatarLarge,
              { backgroundColor: contact.avatarColor },
            ]}
          >
            <Text style={styles.contactAvatarText}>
              {contact.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.contactCopy}>
            <Text style={styles.contactName} numberOfLines={1}>
              {contact.name}
            </Text>
            <Text style={styles.contactPhone}>{contact.phone}</Text>
          </View>
          <Pressable
            onPress={onToggleFavorite}
            accessibilityRole="button"
            accessibilityLabel={
              contact.favorite
                ? `Quitar a ${contact.name} de favoritos`
                : `Agregar a ${contact.name} a favoritos`
            }
            style={[
              styles.favoriteToggle,
              contact.favorite && styles.favoriteToggleActive,
            ]}
          >
            <MaterialCommunityIcons
              name={contact.favorite ? "star" : "star-outline"}
              size={22}
              color={contact.favorite ? palette.accentCyan : palette.textSecondary}
            />
          </Pressable>
        </View>

        <View style={styles.contactActionRow}>
          {actions.map((action) => (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              style={[styles.contactActionButton, action.buttonStyle]}
              accessibilityRole="button"
              accessibilityLabel={`${action.label} a ${contact.name}`}
            >
              <MaterialCommunityIcons
                name={action.icon as any}
                size={18}
                color={action.iconColor}
              />
              <Text style={[styles.contactActionLabel, action.labelStyle]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </GlassCard>
  );
};

const ContactsScreen = () => {
  const router = useRouter();
  const {
    contacts,
    addContact,
    updateContact,
    removeContact,
    toggleFavoriteContact,
  } = useBankStore();

  const [formVisible, setFormVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactDraft>({ name: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedQuery = useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery],
  );
  const digitsQuery = useMemo(() => sanitizePhoneInput(searchQuery), [searchQuery]);
  const hasQuery = normalizedQuery.length > 0 || digitsQuery.length > 0;

  const matchesQuery = useMemo<(contact: Contact) => boolean>(
    () =>
      (contact: Contact) => {
        if (!hasQuery) {
          return true;
        }
        const nameMatch = normalizedQuery.length > 0
          ? contact.name.toLowerCase().includes(normalizedQuery)
          : false;
        const phoneDigits = sanitizePhoneInput(contact.phone);
        const phoneMatch = digitsQuery.length > 0 ? phoneDigits.includes(digitsQuery) : false;
        return nameMatch || phoneMatch;
      },
    [digitsQuery, hasQuery, normalizedQuery],
  );

  const favorites = useMemo(
    () =>
      contacts
        .filter((contact: Contact) => contact.favorite && matchesQuery(contact))
        .sort((a, b) => {
          const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
          const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
          if (aTime !== bTime) {
            return bTime - aTime;
          }
          return a.name.localeCompare(b.name, "es");
        }),
    [contacts, matchesQuery],
  );

  const others = useMemo(
    () =>
      contacts
        .filter((contact: Contact) => !contact.favorite && matchesQuery(contact))
        .sort((a, b) => {
          const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
          const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
          if (aTime !== bTime) {
            return bTime - aTime;
          }
          return a.name.localeCompare(b.name, "es");
        }),
    [contacts, matchesQuery],
  );

  const totalContacts = contacts.length;
  const lastUsed = useMemo(() => {
    const latest = contacts.reduce<string | null>((acc, item) => {
      if (!item.lastUsedAt) {
        return acc;
      }
      if (!acc) {
        return item.lastUsedAt;
      }
      return new Date(item.lastUsedAt) > new Date(acc) ? item.lastUsedAt : acc;
    }, null);
    if (!latest) {
      return "Sin interacciones recientes";
    }
    const diff = Date.now() - new Date(latest).getTime();
    const hours = Math.round(diff / (1000 * 60 * 60));
    if (hours < 1) {
      return "Hace instantes";
    }
    if (hours < 24) {
      return `Hace ${hours} h`;
    }
    const days = Math.round(hours / 24);
    return `Hace ${days} d`;
  }, [contacts]);

  const openCreate = () => {
    setForm({ name: "", phone: "" });
    setEditingContact(null);
    setError(null);
    setFormVisible(true);
  };

  const openEdit = (contact: Contact) => {
    setForm({ name: contact.name, phone: sanitizePhoneInput(contact.phone) });
    setEditingContact(contact);
    setError(null);
    setFormVisible(true);
  };

  const closeModal = () => {
    setFormVisible(false);
    setForm({ name: "", phone: "" });
    setEditingContact(null);
    setError(null);
  };

  const handleSubmit = () => {
    const sanitizedPhone = sanitizePhoneInput(form.phone);

    if (!sanitizedPhone) {
      setError("Ingresa un número telefónico válido.");
      return;
    }
    if (sanitizedPhone.length < PHONE_REQUIRED_LENGTH) {
      setError("El número debe tener al menos 8 dígitos.");
      return;
    }

    const displayPhone = formatPhoneNumber(sanitizedPhone);

    try {
      if (editingContact) {
        updateContact(editingContact.id, {
          name: form.name,
          phone: displayPhone,
          lastUsedAt: editingContact.lastUsedAt,
        });
      } else {
        addContact({
          name: form.name,
          phone: displayPhone,
        });
      }
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    }
  };

  const handleRemove = (contact: Contact) => {
    Alert.alert(
      "Eliminar contacto",
      `¿Deseas eliminar a ${contact.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => removeContact(contact.id),
        },
      ],
    );
  };

  const handleTransfer = (contact: Contact) => {
    router.push({
      pathname: "/(app)/transfer",
      params: {
        contactName: contact.name,
        phone: contact.phone,
      },
    });
  };

  const noResults = hasQuery && favorites.length === 0 && others.length === 0;

  return (
    <FuturisticBackground>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.replace("/(app)/transfer")}
              accessibilityRole="button"
              accessibilityLabel="Volver"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color={palette.textPrimary}
              />
            </Pressable>
            <Text style={styles.title}>Contactos</Text>
            <ProfileAvatarButton
              size={40}
              onPress={() =>
                router.push({
                  pathname: "/(app)/notifications",
                  params: {
                    from: "/(app)/contacts",
                  },
                })
              }
              accessibilityLabel="Ver notificaciones"
              style={styles.profileShortcut}
            />
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 480 }}
          >
            <GlassCard>
              <View style={styles.summaryCard}>
                <View>
                  <Text style={styles.summaryLabel}>Contactos guardados</Text>
                  <Text style={styles.summaryValue}>{totalContacts}</Text>
                  <Text style={styles.summaryHint}>{lastUsed}</Text>
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Favoritos</Text>
                  <Text style={styles.summaryValue}>{favorites.length}</Text>
                  <Text style={styles.summaryHint}>
                    Presiona la estrella para fijarlos primero.
                  </Text>
                </View>
                <PrimaryButton
                  label="Nuevo contacto"
                  onPress={openCreate}
                  style={styles.summaryButton}
                />
              </View>
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 320 }}
            style={styles.searchWrapper}
          >
            <NeonTextField
              label="Buscar"
              placeholder="Nombre o teléfono"
              value={searchQuery}
              onChangeText={setSearchQuery}
              icon={
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={palette.accentCyan}
                />
              }
              autoCapitalize="words"
            />
          </MotiView>

          {contacts.length === 0 ? (
            <GlassCard>
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="account-box-outline"
                  size={46}
                  color={palette.accentCyan}
                />
                <Text style={styles.emptyTitle}>Aún no tienes contactos</Text>
                <Text style={styles.emptyCopy}>
                  Cada transferencia que realices se guardará automáticamente aquí.
                </Text>
                <PrimaryButton label="Agregar manualmente" onPress={openCreate} />
              </View>
            </GlassCard>
          ) : noResults ? (
            <GlassCard>
              <View style={styles.noResults}>
                <MaterialCommunityIcons
                  name="account-search"
                  size={42}
                  color={palette.accentCyan}
                />
                <Text style={styles.noResultsTitle}>Sin coincidencias</Text>
                <Text style={styles.noResultsCopy}>
                  No encontramos contactos que coincidan con "{searchQuery}".
                  Verifica el nombre o número e inténtalo de nuevo.
                </Text>
              </View>
            </GlassCard>
          ) : (
            <View style={styles.listSection}>
              {favorites.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Favoritos</Text>
                  {favorites.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onToggleFavorite={() => toggleFavoriteContact(contact.id)}
                      onTransfer={() => handleTransfer(contact)}
                      onEdit={() => openEdit(contact)}
                      onRemove={() => handleRemove(contact)}
                    />
                  ))}
                </View>
              ) : null}

              {others.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Contactos</Text>
                  {others.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onToggleFavorite={() => toggleFavoriteContact(contact.id)}
                      onTransfer={() => handleTransfer(contact)}
                      onEdit={() => openEdit(contact)}
                      onRemove={() => handleRemove(contact)}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      <ContactFormModal
        visible={formVisible}
        onClose={closeModal}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        error={error}
        editing={!!editingContact}
      />
    </FuturisticBackground>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 180,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 40,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  backLogo: {
    width: 22,
    height: 22,
    transform: [{ rotate: "-90deg" }],
  },
  profileShortcut: {
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  summaryCard: {
    gap: 18,
    padding: 22,
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: palette.textPrimary,
    fontSize: 26,
    fontWeight: "800",
  },
  summaryHint: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  summaryButton: {
    marginTop: 8,
  },
  searchWrapper: {
    marginTop: 12,
  },
  emptyState: {
    padding: 28,
    alignItems: "center",
    gap: 16,
  },
  emptyTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyCopy: {
    color: palette.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  listSection: {
    gap: 24,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 6,
  },
  noResults: {
    padding: 28,
    alignItems: "center",
    gap: 14,
  },
  noResultsTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  noResultsCopy: {
    color: palette.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  contactCard: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    gap: 16,
  },
  contactInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  contactAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  contactAvatarText: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: "800",
  },
  contactCopy: {
    flex: 1,
    gap: 4,
  },
  contactName: {
    color: palette.textPrimary,
    fontWeight: "700",
    fontSize: 18,
  },
  contactPhone: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  favoriteToggle: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  favoriteToggleActive: {
    backgroundColor: "rgba(0, 240, 255, 0.16)",
  },
  contactActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
  },
  contactActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    gap: 8,
    minWidth: 110,
    flexGrow: 1,
  },
  contactActionPrimary: {
    backgroundColor: "rgba(0, 240, 255, 0.18)",
  },
  contactActionDanger: {
    backgroundColor: "rgba(255, 71, 87, 0.18)",
  },
  contactActionLabel: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  contactActionLabelPrimary: {
    color: palette.textPrimary,
  },
  contactActionLabelDanger: {
    color: palette.danger,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 17, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: "rgba(10, 18, 32, 0.92)",
    padding: 24,
    gap: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  modalTitle: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  modalSecondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  modalSecondaryLabel: {
    color: palette.textSecondary,
    fontWeight: "600",
  },
  errorText: {
    color: palette.danger,
    fontSize: 13,
  },
});

export default ContactsScreen;
