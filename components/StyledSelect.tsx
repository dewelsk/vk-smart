'use client'

import ReactSelect, { Props as ReactSelectProps, GroupBase } from 'react-select'

export type SelectOption = {
  value: string
  label: string
}

type StyledSelectProps<
  Option = SelectOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
> = Omit<ReactSelectProps<Option, IsMulti, Group>, 'styles' | 'theme'> & {
  // Allow custom width via className
  className?: string
  'data-testid'?: string
}

const customStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderColor: state.isFocused ? '#504EDD' : '#EAE9EA',
    borderRadius: '10px',
    minHeight: '42px',
    // Match Tailwind's focus:ring-1 focus:ring-ds-purple-80
    boxShadow: state.isFocused
      ? '0 0 0 1px #504EDD'
      : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#504EDD' : '#D4D3D5',
    },
    backgroundColor: 'white',
    fontSize: '14px',
  }),
  placeholder: (base: any) => ({
    ...base,
    color: '#6A646B',
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#554E55',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#504EDD'
      : state.isFocused
      ? '#F4F3F5'
      : 'white',
    color: state.isSelected ? 'white' : '#554E55',
    fontSize: '14px',
    padding: '10px 12px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: state.isSelected ? '#504EDD' : '#EAE9EA',
    },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '10px',
    boxShadow: '0px 8px 25px 0px rgba(42,34,43,0.15)',
    border: '1px solid #EAE9EA',
    overflow: 'hidden',
    zIndex: 50,
  }),
  menuList: (base: any) => ({
    ...base,
    padding: 0,
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (base: any, state: any) => ({
    ...base,
    color: '#6A646B',
    transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0)',
    transition: 'transform 0.2s ease',
    '&:hover': {
      color: '#3F3840',
    },
  }),
  clearIndicator: (base: any) => ({
    ...base,
    color: '#6A646B',
    cursor: 'pointer',
    '&:hover': {
      color: '#3F3840',
    },
  }),
  input: (base: any) => ({
    ...base,
    color: '#554E55',
  }),
}

export function StyledSelect<
  Option = SelectOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>({ className, 'data-testid': testId, ...props }: StyledSelectProps<Option, IsMulti, Group>) {
  return (
    <div className={className} data-testid={testId}>
      <ReactSelect<Option, IsMulti, Group>
        styles={customStyles}
        inputId={testId ? `${testId}-input` : undefined}
        {...props}
      />
    </div>
  )
}

// Simple select for cases where we don't need search (acts like native select)
type SimpleSelectProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  isClearable?: boolean
  isSearchable?: boolean
  'data-testid'?: string
}

export function SimpleSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  isClearable = false,
  isSearchable = false,
  'data-testid': testId,
}: SimpleSelectProps) {
  const selectedOption = options.find((opt) => opt.value === value) || null

  return (
    <div className={className} data-testid={testId}>
      <ReactSelect<SelectOption, false>
        value={selectedOption}
        onChange={(option) => onChange(option?.value || '')}
        options={options}
        placeholder={placeholder}
        isClearable={isClearable}
        isSearchable={isSearchable}
        styles={customStyles}
        inputId={testId ? `${testId}-input` : undefined}
      />
    </div>
  )
}

export default StyledSelect
