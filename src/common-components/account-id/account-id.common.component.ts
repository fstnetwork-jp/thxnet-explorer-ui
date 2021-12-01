/*
 * Polkascan Explorer UI
 * Copyright (C) 2018-2021 Polkascan Foundation (NL)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output, SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { IconTheme } from '../identicon/identicon.types';
import { Prefix } from '@polkadot/util-crypto/address/types';
import { encodeAddress } from '@polkadot/util-crypto';
import { HexString } from '@polkadot/util/types';
import { isHex, isU8a } from '@polkadot/util';

@Component({
  selector: 'account-id',
  template: `
    <ng-container *ngIf="encoded">
      <identicon *ngIf="!hideIdenticon" [value]="encoded" [theme]="iconTheme" [size]="iconSize"
                 [prefix]="ss58Prefix"></identicon>
      <a (click)="clicked.next(encoded)" href="javascript: void">{{ encoded }}</a>
    </ng-container>
  `,
  styles: [`
    account-id {
      display: flex;
      flex-wrap: nowrap;
      justify-content: flex-start;
      align-items: center;

      identicon {
        margin-right: 0.3rem;
      }
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountIdCommonComponent implements OnChanges {
  @Input() address: HexString | Uint8Array | string;
  @Input() hideIdenticon?: boolean;
  @Input() iconTheme?: IconTheme;
  @Input() iconSize?: number;
  @Input() ss58Prefix?: Prefix;
  @Output() clicked = new EventEmitter();

  encoded: string;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['address']) {
      const value = changes['address'].currentValue;
      let address = '';

      if (value) {
        address = isU8a(value) || isHex(value)
          ? encodeAddress(value, this.ss58Prefix)
          : (value || '');
      }

      this.encoded = address;
    }
  }

  constructor() {
  }
}
