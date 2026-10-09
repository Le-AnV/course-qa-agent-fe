import * as React from 'react';

type IonIconProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement> & {
    name?: string;
    'aria-hidden'?: string | boolean;
    class?: string;
  },
  HTMLElement
>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ion-icon': IonIconProps;
    }
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'ion-icon': IonIconProps;
      }
    }
  }
}
