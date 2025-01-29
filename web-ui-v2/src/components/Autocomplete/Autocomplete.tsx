'use client'
import { autocomplete, AutocompleteOptions } from '@algolia/autocomplete-js';
import React, { createElement, Fragment, useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import '@algolia/autocomplete-theme-classic';

interface AutocompleteProps extends Partial<AutocompleteOptions<any>> {}

export function Autocomplete(props: AutocompleteProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRootRef = useRef<Root | null>(null);
  const rootRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const search = autocomplete({
      container: containerRef.current,
      renderer: { createElement, Fragment, render: () => {} },
      render({ children }, root) {
        if (!panelRootRef.current || rootRef.current !== root) {
          rootRef.current = root;

          panelRootRef.current?.unmount();
          panelRootRef.current = createRoot(root);
        }

        panelRootRef.current.render(children);
      },
      ...props,
    });

    return () => {
      search.destroy();
    };
  }, [props]);

  return <div ref={containerRef} />;
}
