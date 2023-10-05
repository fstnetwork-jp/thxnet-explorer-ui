/*
 * Polkascan Explorer UI
 * Copyright (C) 2018-2023 Polkascan Foundation (NL)
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

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type SubsquidConfig = {
  archiveUrl: string,
  explorerUrl: string;
  giantSquidExplorerUrl: string;
  giantSquidMainUrl: string;
}

export type NetworkSpecs = {
  groupName?: string;
  name?: string;
  image?: string;
  relayChain?: string;
  substrateRpcUrlArray: string[];
  explorerWsUrlArray: string[];
  subsquid: SubsquidConfig;
  coingecko: {
    coinId: string;
  };
};

export type NetworkConfig = {
  [network: string]: NetworkSpecs;
};

@Injectable()
export class AppConfig {
  networks: NetworkConfig;

  constructor(private readonly http: HttpClient) {
  }

  public load(): Promise<void> {
    return this.http
      .get<NetworkConfig>('assets/config.json')
      .toPromise()
      .then(config => {
        this.networks = config || {};
      });
  }
}

export function initConfig(config: AppConfig): () => Promise<void> {
  return () => config.load();
}
