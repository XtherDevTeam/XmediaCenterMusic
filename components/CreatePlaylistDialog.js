import React, { useState } from 'react';
import { Dialog, Portal, TextInput, Button } from 'react-native-paper';

const CreatePlaylistDialog = React.memo(({ visible, onDismiss, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0); // Used to reset uncontrolled inputs

  // Reset form when visibility changes to false
  React.useEffect(() => {
    if (!visible) {
      setName('');
      setDescription('');
      setFormKey(prev => prev + 1);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name, description);
    setLoading(false);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Create New Playlist</Dialog.Title>
        <Dialog.Content key={formKey}>
          <TextInput
            label="Playlist Name"
            defaultValue=""
            onChangeText={setName}
            style={{ marginBottom: 10 }}
            mode="outlined"
          />
          <TextInput
            label="Description"
            defaultValue=""
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            mode="outlined"
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={loading}>Cancel</Button>
          <Button onPress={handleCreate} loading={loading} disabled={!name.trim() || loading}>Create</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
});

export default CreatePlaylistDialog;

