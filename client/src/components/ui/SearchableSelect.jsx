import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

export function SearchableSelect({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select an option...",
  disabled = false,
  className
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  const isSearchTermExactValue = value && searchTerm === value;
  const filteredOptions = isSearchTermExactValue 
    ? options 
    : options.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));

  // Sync internal search term with external value when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(value || '');
    } else {
      setHighlightedIndex(0); // Reset highlight when opening
    }
  }, [isOpen, value]);

  // Reset highlight when search term changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeElement = listRef.current.children[highlightedIndex];
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (option) => {
    onChange(option);
    setSearchTerm(option);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        className={cn(
          "flex h-[40px] w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-shadow",
          className
        )}
        placeholder={placeholder}
        value={isOpen ? searchTerm : (value || '')}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      
      {/* Dropdown Arrow Indicator */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && !disabled && (
        <ul 
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-canvas border border-hairline rounded-md shadow-lg max-h-60 overflow-y-auto py-1"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={index}
                className={cn(
                  "px-3 py-2 text-sm text-ink cursor-pointer transition-colors",
                  index === highlightedIndex ? "bg-surface-soft" : "hover:bg-surface-soft"
                )}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-muted italic">No options found</li>
          )}
        </ul>
      )}
    </div>
  );
}
