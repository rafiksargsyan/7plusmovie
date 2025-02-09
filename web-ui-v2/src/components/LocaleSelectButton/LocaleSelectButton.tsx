import { Locale } from "@/i18n/routing";
import { ActionIcon, Button, CheckIcon, Combobox, Group, UnstyledButton, useCombobox } from "@mantine/core";
import { IconLanguage } from "@tabler/icons-react";
import { useState } from "react";

export function LocaleSelectButton() {
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [value, setValue] = useState<string | null>('English');
    const combobox = useCombobox({
      onDropdownClose: () => combobox.resetSelectedOption(),
      onDropdownOpen: (eventSource) => {
        if (eventSource === 'keyboard') {
          combobox.selectActiveOption();
        } else {
          combobox.updateSelectedOptionIndex('active');
        }
      },
    });
  
    const options = Object.keys(Locale.FROM_NATIVE_DISPLAY_NAME).map((dn) => (
      <Combobox.Option key={Locale.FROM_NATIVE_DISPLAY_NAME[dn].langTag} value={dn} active={ dn === value }>
        <Group gap="xs">
          <span>{dn}</span>
          {dn === value && <CheckIcon size={12} />}
      </Group>
      </Combobox.Option>
    ));
  
    return (
      <>
        <Combobox
          store={combobox}
          position="bottom-end"
          width="auto"
          withArrow
          withinPortal={false}
          onOptionSubmit={(val) => {
            setSelectedItem(val);
            combobox.closeDropdown();
            setValue(val);
          }}
        >
          <Combobox.Target>
            <ActionIcon variant="filled" color="gray" aria-label="Settings" onClick={() => combobox.toggleDropdown()}>
              <IconLanguage style={{ width: '70%', height: '70%' }} stroke={1.5} />
            </ActionIcon>
          </Combobox.Target>
  
          <Combobox.Dropdown>
            <Combobox.Options>{options}</Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
      </>
    );
  }
  