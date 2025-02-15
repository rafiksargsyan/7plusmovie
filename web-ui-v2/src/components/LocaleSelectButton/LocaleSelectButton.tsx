import { Locale } from "@/i18n/routing";
import { ActionIcon, CheckIcon, Combobox, Group, useCombobox } from "@mantine/core";
import { IconLanguage } from "@tabler/icons-react";
import { useState } from "react";

interface LocaleSelectButtonProps {
  defaultLocaleDisplayName: string,
  onLocaleSelect: (locale: string) => void
}

export function LocaleSelectButton(props: LocaleSelectButtonProps) {
    const [value, setValue] = useState<string>(props.defaultLocaleDisplayName);
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
            combobox.closeDropdown();
            setValue(val);
            props.onLocaleSelect(Locale.FROM_NATIVE_DISPLAY_NAME[val].langTag)
          }}
        >
          <Combobox.Target>
            <ActionIcon variant="default" size='lg' aria-label="todo" onClick={() => combobox.toggleDropdown()}>
              <IconLanguage />
            </ActionIcon>
          </Combobox.Target>
  
          <Combobox.Dropdown>
            <Combobox.Options>{options}</Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
      </>
    );
  }
