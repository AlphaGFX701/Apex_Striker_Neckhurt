/** Artist-authored pixel fleet. Model stats deliberately do not belong here. */
export type ShipId = 0 | 1 | 2;
export type ShipLevel = 1 | 2 | 3;
export interface FleetImage { readonly key: string; readonly url: string; }
export interface ShipLevelDefinition extends FleetImage {
  readonly level: ShipLevel;
  readonly canvasSize: number;
  readonly anchor: { readonly x: number; readonly y: number };
  readonly alphaBounds: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly gunMounts: readonly { readonly x: number; readonly y: number }[];
  readonly engineFrames: readonly FleetImage[];
  readonly muzzleFrames: readonly FleetImage[];
  readonly bankFrames: { readonly left: FleetImage; readonly right: FleetImage };
  readonly unfoldFrames: readonly FleetImage[];
}
export interface ShipDefinition {
  readonly id: ShipId;
  readonly name: string;
  readonly slug: string;
  readonly role: string;
  readonly sourceHull: string;
  readonly displayWidth: number;
  readonly levels: Readonly<Record<ShipLevel, ShipLevelDefinition>>;
}
export const SHIPS: readonly ShipDefinition[] = [
  {
    "id": 0,
    "name": "Falcon",
    "slug": "falcon",
    "role": "Strike fighter",
    "sourceHull": "Nairan Fighter",
    "displayWidth": 132,
    "levels": {
      "1": {
        "level": 1,
        "key": "pixel-falcon-1",
        "url": "/assets/pixel-fleet/pixel-falcon-1.png",
        "canvasSize": 192,
        "anchor": {
          "x": 96,
          "y": 96
        },
        "alphaBounds": {
          "x": 51,
          "y": 60,
          "width": 90,
          "height": 81
        },
        "gunMounts": [
          {
            "x": 96,
            "y": 60
          }
        ],
        "engineFrames": [
          {
            "key": "pixel-falcon-1-engine-0",
            "url": "/assets/pixel-fleet/pixel-falcon-1-engine-0.png"
          },
          {
            "key": "pixel-falcon-1-engine-1",
            "url": "/assets/pixel-fleet/pixel-falcon-1-engine-1.png"
          },
          {
            "key": "pixel-falcon-1-engine-2",
            "url": "/assets/pixel-fleet/pixel-falcon-1-engine-2.png"
          },
          {
            "key": "pixel-falcon-1-engine-3",
            "url": "/assets/pixel-fleet/pixel-falcon-1-engine-3.png"
          },
          {
            "key": "pixel-falcon-1-engine-4",
            "url": "/assets/pixel-fleet/pixel-falcon-1-engine-4.png"
          },
          {
            "key": "pixel-falcon-1-engine-5",
            "url": "/assets/pixel-fleet/pixel-falcon-1-engine-5.png"
          },
          {
            "key": "pixel-falcon-1-engine-6",
            "url": "/assets/pixel-fleet/pixel-falcon-1-engine-6.png"
          },
          {
            "key": "pixel-falcon-1-engine-7",
            "url": "/assets/pixel-fleet/pixel-falcon-1-engine-7.png"
          }
        ],
        "muzzleFrames": [
          {
            "key": "pixel-falcon-1-muzzle-0",
            "url": "/assets/pixel-fleet/pixel-falcon-1-muzzle-0.png"
          },
          {
            "key": "pixel-falcon-1-muzzle-1",
            "url": "/assets/pixel-fleet/pixel-falcon-1-muzzle-1.png"
          },
          {
            "key": "pixel-falcon-1-muzzle-2",
            "url": "/assets/pixel-fleet/pixel-falcon-1-muzzle-2.png"
          }
        ],
        "bankFrames": {
          "left": {
            "key": "pixel-falcon-1-bank-left",
            "url": "/assets/pixel-fleet/pixel-falcon-1-bank-left.png"
          },
          "right": {
            "key": "pixel-falcon-1-bank-right",
            "url": "/assets/pixel-fleet/pixel-falcon-1-bank-right.png"
          }
        },
        "unfoldFrames": []
      },
      "2": {
        "level": 2,
        "key": "pixel-falcon-2",
        "url": "/assets/pixel-fleet/pixel-falcon-2.png",
        "canvasSize": 192,
        "anchor": {
          "x": 96,
          "y": 96
        },
        "alphaBounds": {
          "x": 33,
          "y": 60,
          "width": 126,
          "height": 81
        },
        "gunMounts": [
          {
            "x": 87,
            "y": 60
          },
          {
            "x": 105,
            "y": 60
          }
        ],
        "engineFrames": [
          {
            "key": "pixel-falcon-2-engine-0",
            "url": "/assets/pixel-fleet/pixel-falcon-2-engine-0.png"
          },
          {
            "key": "pixel-falcon-2-engine-1",
            "url": "/assets/pixel-fleet/pixel-falcon-2-engine-1.png"
          },
          {
            "key": "pixel-falcon-2-engine-2",
            "url": "/assets/pixel-fleet/pixel-falcon-2-engine-2.png"
          },
          {
            "key": "pixel-falcon-2-engine-3",
            "url": "/assets/pixel-fleet/pixel-falcon-2-engine-3.png"
          },
          {
            "key": "pixel-falcon-2-engine-4",
            "url": "/assets/pixel-fleet/pixel-falcon-2-engine-4.png"
          },
          {
            "key": "pixel-falcon-2-engine-5",
            "url": "/assets/pixel-fleet/pixel-falcon-2-engine-5.png"
          },
          {
            "key": "pixel-falcon-2-engine-6",
            "url": "/assets/pixel-fleet/pixel-falcon-2-engine-6.png"
          },
          {
            "key": "pixel-falcon-2-engine-7",
            "url": "/assets/pixel-fleet/pixel-falcon-2-engine-7.png"
          }
        ],
        "muzzleFrames": [
          {
            "key": "pixel-falcon-2-muzzle-0",
            "url": "/assets/pixel-fleet/pixel-falcon-2-muzzle-0.png"
          },
          {
            "key": "pixel-falcon-2-muzzle-1",
            "url": "/assets/pixel-fleet/pixel-falcon-2-muzzle-1.png"
          },
          {
            "key": "pixel-falcon-2-muzzle-2",
            "url": "/assets/pixel-fleet/pixel-falcon-2-muzzle-2.png"
          }
        ],
        "bankFrames": {
          "left": {
            "key": "pixel-falcon-2-bank-left",
            "url": "/assets/pixel-fleet/pixel-falcon-2-bank-left.png"
          },
          "right": {
            "key": "pixel-falcon-2-bank-right",
            "url": "/assets/pixel-fleet/pixel-falcon-2-bank-right.png"
          }
        },
        "unfoldFrames": [
          {
            "key": "pixel-falcon-2-unfold-0",
            "url": "/assets/pixel-fleet/pixel-falcon-2-unfold-0.png"
          },
          {
            "key": "pixel-falcon-2-unfold-1",
            "url": "/assets/pixel-fleet/pixel-falcon-2-unfold-1.png"
          },
          {
            "key": "pixel-falcon-2-unfold-2",
            "url": "/assets/pixel-fleet/pixel-falcon-2-unfold-2.png"
          },
          {
            "key": "pixel-falcon-2-unfold-3",
            "url": "/assets/pixel-fleet/pixel-falcon-2-unfold-3.png"
          }
        ]
      },
      "3": {
        "level": 3,
        "key": "pixel-falcon-3",
        "url": "/assets/pixel-fleet/pixel-falcon-3.png",
        "canvasSize": 192,
        "anchor": {
          "x": 96,
          "y": 96
        },
        "alphaBounds": {
          "x": 6,
          "y": 51,
          "width": 180,
          "height": 93
        },
        "gunMounts": [
          {
            "x": 81,
            "y": 51
          },
          {
            "x": 96,
            "y": 51
          },
          {
            "x": 111,
            "y": 51
          }
        ],
        "engineFrames": [
          {
            "key": "pixel-falcon-3-engine-0",
            "url": "/assets/pixel-fleet/pixel-falcon-3-engine-0.png"
          },
          {
            "key": "pixel-falcon-3-engine-1",
            "url": "/assets/pixel-fleet/pixel-falcon-3-engine-1.png"
          },
          {
            "key": "pixel-falcon-3-engine-2",
            "url": "/assets/pixel-fleet/pixel-falcon-3-engine-2.png"
          },
          {
            "key": "pixel-falcon-3-engine-3",
            "url": "/assets/pixel-fleet/pixel-falcon-3-engine-3.png"
          },
          {
            "key": "pixel-falcon-3-engine-4",
            "url": "/assets/pixel-fleet/pixel-falcon-3-engine-4.png"
          },
          {
            "key": "pixel-falcon-3-engine-5",
            "url": "/assets/pixel-fleet/pixel-falcon-3-engine-5.png"
          },
          {
            "key": "pixel-falcon-3-engine-6",
            "url": "/assets/pixel-fleet/pixel-falcon-3-engine-6.png"
          },
          {
            "key": "pixel-falcon-3-engine-7",
            "url": "/assets/pixel-fleet/pixel-falcon-3-engine-7.png"
          }
        ],
        "muzzleFrames": [
          {
            "key": "pixel-falcon-3-muzzle-0",
            "url": "/assets/pixel-fleet/pixel-falcon-3-muzzle-0.png"
          },
          {
            "key": "pixel-falcon-3-muzzle-1",
            "url": "/assets/pixel-fleet/pixel-falcon-3-muzzle-1.png"
          },
          {
            "key": "pixel-falcon-3-muzzle-2",
            "url": "/assets/pixel-fleet/pixel-falcon-3-muzzle-2.png"
          }
        ],
        "bankFrames": {
          "left": {
            "key": "pixel-falcon-3-bank-left",
            "url": "/assets/pixel-fleet/pixel-falcon-3-bank-left.png"
          },
          "right": {
            "key": "pixel-falcon-3-bank-right",
            "url": "/assets/pixel-fleet/pixel-falcon-3-bank-right.png"
          }
        },
        "unfoldFrames": [
          {
            "key": "pixel-falcon-3-unfold-0",
            "url": "/assets/pixel-fleet/pixel-falcon-3-unfold-0.png"
          },
          {
            "key": "pixel-falcon-3-unfold-1",
            "url": "/assets/pixel-fleet/pixel-falcon-3-unfold-1.png"
          },
          {
            "key": "pixel-falcon-3-unfold-2",
            "url": "/assets/pixel-fleet/pixel-falcon-3-unfold-2.png"
          },
          {
            "key": "pixel-falcon-3-unfold-3",
            "url": "/assets/pixel-fleet/pixel-falcon-3-unfold-3.png"
          }
        ]
      }
    }
  },
  {
    "id": 1,
    "name": "Raven",
    "slug": "raven",
    "role": "Recon interceptor",
    "sourceHull": "Nairan Scout",
    "displayWidth": 132,
    "levels": {
      "1": {
        "level": 1,
        "key": "pixel-raven-1",
        "url": "/assets/pixel-fleet/pixel-raven-1.png",
        "canvasSize": 192,
        "anchor": {
          "x": 96,
          "y": 96
        },
        "alphaBounds": {
          "x": 60,
          "y": 69,
          "width": 72,
          "height": 66
        },
        "gunMounts": [
          {
            "x": 96,
            "y": 69
          }
        ],
        "engineFrames": [
          {
            "key": "pixel-raven-1-engine-0",
            "url": "/assets/pixel-fleet/pixel-raven-1-engine-0.png"
          },
          {
            "key": "pixel-raven-1-engine-1",
            "url": "/assets/pixel-fleet/pixel-raven-1-engine-1.png"
          },
          {
            "key": "pixel-raven-1-engine-2",
            "url": "/assets/pixel-fleet/pixel-raven-1-engine-2.png"
          },
          {
            "key": "pixel-raven-1-engine-3",
            "url": "/assets/pixel-fleet/pixel-raven-1-engine-3.png"
          },
          {
            "key": "pixel-raven-1-engine-4",
            "url": "/assets/pixel-fleet/pixel-raven-1-engine-4.png"
          },
          {
            "key": "pixel-raven-1-engine-5",
            "url": "/assets/pixel-fleet/pixel-raven-1-engine-5.png"
          },
          {
            "key": "pixel-raven-1-engine-6",
            "url": "/assets/pixel-fleet/pixel-raven-1-engine-6.png"
          },
          {
            "key": "pixel-raven-1-engine-7",
            "url": "/assets/pixel-fleet/pixel-raven-1-engine-7.png"
          }
        ],
        "muzzleFrames": [
          {
            "key": "pixel-raven-1-muzzle-0",
            "url": "/assets/pixel-fleet/pixel-raven-1-muzzle-0.png"
          },
          {
            "key": "pixel-raven-1-muzzle-1",
            "url": "/assets/pixel-fleet/pixel-raven-1-muzzle-1.png"
          },
          {
            "key": "pixel-raven-1-muzzle-2",
            "url": "/assets/pixel-fleet/pixel-raven-1-muzzle-2.png"
          }
        ],
        "bankFrames": {
          "left": {
            "key": "pixel-raven-1-bank-left",
            "url": "/assets/pixel-fleet/pixel-raven-1-bank-left.png"
          },
          "right": {
            "key": "pixel-raven-1-bank-right",
            "url": "/assets/pixel-fleet/pixel-raven-1-bank-right.png"
          }
        },
        "unfoldFrames": []
      },
      "2": {
        "level": 2,
        "key": "pixel-raven-2",
        "url": "/assets/pixel-fleet/pixel-raven-2.png",
        "canvasSize": 192,
        "anchor": {
          "x": 96,
          "y": 96
        },
        "alphaBounds": {
          "x": 36,
          "y": 66,
          "width": 120,
          "height": 69
        },
        "gunMounts": [
          {
            "x": 87,
            "y": 66
          },
          {
            "x": 105,
            "y": 66
          }
        ],
        "engineFrames": [
          {
            "key": "pixel-raven-2-engine-0",
            "url": "/assets/pixel-fleet/pixel-raven-2-engine-0.png"
          },
          {
            "key": "pixel-raven-2-engine-1",
            "url": "/assets/pixel-fleet/pixel-raven-2-engine-1.png"
          },
          {
            "key": "pixel-raven-2-engine-2",
            "url": "/assets/pixel-fleet/pixel-raven-2-engine-2.png"
          },
          {
            "key": "pixel-raven-2-engine-3",
            "url": "/assets/pixel-fleet/pixel-raven-2-engine-3.png"
          },
          {
            "key": "pixel-raven-2-engine-4",
            "url": "/assets/pixel-fleet/pixel-raven-2-engine-4.png"
          },
          {
            "key": "pixel-raven-2-engine-5",
            "url": "/assets/pixel-fleet/pixel-raven-2-engine-5.png"
          },
          {
            "key": "pixel-raven-2-engine-6",
            "url": "/assets/pixel-fleet/pixel-raven-2-engine-6.png"
          },
          {
            "key": "pixel-raven-2-engine-7",
            "url": "/assets/pixel-fleet/pixel-raven-2-engine-7.png"
          }
        ],
        "muzzleFrames": [
          {
            "key": "pixel-raven-2-muzzle-0",
            "url": "/assets/pixel-fleet/pixel-raven-2-muzzle-0.png"
          },
          {
            "key": "pixel-raven-2-muzzle-1",
            "url": "/assets/pixel-fleet/pixel-raven-2-muzzle-1.png"
          },
          {
            "key": "pixel-raven-2-muzzle-2",
            "url": "/assets/pixel-fleet/pixel-raven-2-muzzle-2.png"
          }
        ],
        "bankFrames": {
          "left": {
            "key": "pixel-raven-2-bank-left",
            "url": "/assets/pixel-fleet/pixel-raven-2-bank-left.png"
          },
          "right": {
            "key": "pixel-raven-2-bank-right",
            "url": "/assets/pixel-fleet/pixel-raven-2-bank-right.png"
          }
        },
        "unfoldFrames": [
          {
            "key": "pixel-raven-2-unfold-0",
            "url": "/assets/pixel-fleet/pixel-raven-2-unfold-0.png"
          },
          {
            "key": "pixel-raven-2-unfold-1",
            "url": "/assets/pixel-fleet/pixel-raven-2-unfold-1.png"
          },
          {
            "key": "pixel-raven-2-unfold-2",
            "url": "/assets/pixel-fleet/pixel-raven-2-unfold-2.png"
          },
          {
            "key": "pixel-raven-2-unfold-3",
            "url": "/assets/pixel-fleet/pixel-raven-2-unfold-3.png"
          }
        ]
      },
      "3": {
        "level": 3,
        "key": "pixel-raven-3",
        "url": "/assets/pixel-fleet/pixel-raven-3.png",
        "canvasSize": 192,
        "anchor": {
          "x": 96,
          "y": 96
        },
        "alphaBounds": {
          "x": 6,
          "y": 57,
          "width": 180,
          "height": 78
        },
        "gunMounts": [
          {
            "x": 81,
            "y": 57
          },
          {
            "x": 96,
            "y": 57
          },
          {
            "x": 111,
            "y": 57
          }
        ],
        "engineFrames": [
          {
            "key": "pixel-raven-3-engine-0",
            "url": "/assets/pixel-fleet/pixel-raven-3-engine-0.png"
          },
          {
            "key": "pixel-raven-3-engine-1",
            "url": "/assets/pixel-fleet/pixel-raven-3-engine-1.png"
          },
          {
            "key": "pixel-raven-3-engine-2",
            "url": "/assets/pixel-fleet/pixel-raven-3-engine-2.png"
          },
          {
            "key": "pixel-raven-3-engine-3",
            "url": "/assets/pixel-fleet/pixel-raven-3-engine-3.png"
          },
          {
            "key": "pixel-raven-3-engine-4",
            "url": "/assets/pixel-fleet/pixel-raven-3-engine-4.png"
          },
          {
            "key": "pixel-raven-3-engine-5",
            "url": "/assets/pixel-fleet/pixel-raven-3-engine-5.png"
          },
          {
            "key": "pixel-raven-3-engine-6",
            "url": "/assets/pixel-fleet/pixel-raven-3-engine-6.png"
          },
          {
            "key": "pixel-raven-3-engine-7",
            "url": "/assets/pixel-fleet/pixel-raven-3-engine-7.png"
          }
        ],
        "muzzleFrames": [
          {
            "key": "pixel-raven-3-muzzle-0",
            "url": "/assets/pixel-fleet/pixel-raven-3-muzzle-0.png"
          },
          {
            "key": "pixel-raven-3-muzzle-1",
            "url": "/assets/pixel-fleet/pixel-raven-3-muzzle-1.png"
          },
          {
            "key": "pixel-raven-3-muzzle-2",
            "url": "/assets/pixel-fleet/pixel-raven-3-muzzle-2.png"
          }
        ],
        "bankFrames": {
          "left": {
            "key": "pixel-raven-3-bank-left",
            "url": "/assets/pixel-fleet/pixel-raven-3-bank-left.png"
          },
          "right": {
            "key": "pixel-raven-3-bank-right",
            "url": "/assets/pixel-fleet/pixel-raven-3-bank-right.png"
          }
        },
        "unfoldFrames": [
          {
            "key": "pixel-raven-3-unfold-0",
            "url": "/assets/pixel-fleet/pixel-raven-3-unfold-0.png"
          },
          {
            "key": "pixel-raven-3-unfold-1",
            "url": "/assets/pixel-fleet/pixel-raven-3-unfold-1.png"
          },
          {
            "key": "pixel-raven-3-unfold-2",
            "url": "/assets/pixel-fleet/pixel-raven-3-unfold-2.png"
          },
          {
            "key": "pixel-raven-3-unfold-3",
            "url": "/assets/pixel-fleet/pixel-raven-3-unfold-3.png"
          }
        ]
      }
    }
  },
  {
    "id": 2,
    "name": "Atlas",
    "slug": "atlas",
    "role": "Heavy gunship",
    "sourceHull": "Nairan Bomber",
    "displayWidth": 132,
    "levels": {
      "1": {
        "level": 1,
        "key": "pixel-atlas-1",
        "url": "/assets/pixel-fleet/pixel-atlas-1.png",
        "canvasSize": 192,
        "anchor": {
          "x": 96,
          "y": 96
        },
        "alphaBounds": {
          "x": 48,
          "y": 54,
          "width": 96,
          "height": 90
        },
        "gunMounts": [
          {
            "x": 96,
            "y": 60
          }
        ],
        "engineFrames": [
          {
            "key": "pixel-atlas-1-engine-0",
            "url": "/assets/pixel-fleet/pixel-atlas-1-engine-0.png"
          },
          {
            "key": "pixel-atlas-1-engine-1",
            "url": "/assets/pixel-fleet/pixel-atlas-1-engine-1.png"
          },
          {
            "key": "pixel-atlas-1-engine-2",
            "url": "/assets/pixel-fleet/pixel-atlas-1-engine-2.png"
          },
          {
            "key": "pixel-atlas-1-engine-3",
            "url": "/assets/pixel-fleet/pixel-atlas-1-engine-3.png"
          },
          {
            "key": "pixel-atlas-1-engine-4",
            "url": "/assets/pixel-fleet/pixel-atlas-1-engine-4.png"
          },
          {
            "key": "pixel-atlas-1-engine-5",
            "url": "/assets/pixel-fleet/pixel-atlas-1-engine-5.png"
          },
          {
            "key": "pixel-atlas-1-engine-6",
            "url": "/assets/pixel-fleet/pixel-atlas-1-engine-6.png"
          },
          {
            "key": "pixel-atlas-1-engine-7",
            "url": "/assets/pixel-fleet/pixel-atlas-1-engine-7.png"
          }
        ],
        "muzzleFrames": [
          {
            "key": "pixel-atlas-1-muzzle-0",
            "url": "/assets/pixel-fleet/pixel-atlas-1-muzzle-0.png"
          },
          {
            "key": "pixel-atlas-1-muzzle-1",
            "url": "/assets/pixel-fleet/pixel-atlas-1-muzzle-1.png"
          },
          {
            "key": "pixel-atlas-1-muzzle-2",
            "url": "/assets/pixel-fleet/pixel-atlas-1-muzzle-2.png"
          }
        ],
        "bankFrames": {
          "left": {
            "key": "pixel-atlas-1-bank-left",
            "url": "/assets/pixel-fleet/pixel-atlas-1-bank-left.png"
          },
          "right": {
            "key": "pixel-atlas-1-bank-right",
            "url": "/assets/pixel-fleet/pixel-atlas-1-bank-right.png"
          }
        },
        "unfoldFrames": []
      },
      "2": {
        "level": 2,
        "key": "pixel-atlas-2",
        "url": "/assets/pixel-fleet/pixel-atlas-2.png",
        "canvasSize": 192,
        "anchor": {
          "x": 96,
          "y": 96
        },
        "alphaBounds": {
          "x": 24,
          "y": 54,
          "width": 144,
          "height": 93
        },
        "gunMounts": [
          {
            "x": 87,
            "y": 60
          },
          {
            "x": 105,
            "y": 60
          }
        ],
        "engineFrames": [
          {
            "key": "pixel-atlas-2-engine-0",
            "url": "/assets/pixel-fleet/pixel-atlas-2-engine-0.png"
          },
          {
            "key": "pixel-atlas-2-engine-1",
            "url": "/assets/pixel-fleet/pixel-atlas-2-engine-1.png"
          },
          {
            "key": "pixel-atlas-2-engine-2",
            "url": "/assets/pixel-fleet/pixel-atlas-2-engine-2.png"
          },
          {
            "key": "pixel-atlas-2-engine-3",
            "url": "/assets/pixel-fleet/pixel-atlas-2-engine-3.png"
          },
          {
            "key": "pixel-atlas-2-engine-4",
            "url": "/assets/pixel-fleet/pixel-atlas-2-engine-4.png"
          },
          {
            "key": "pixel-atlas-2-engine-5",
            "url": "/assets/pixel-fleet/pixel-atlas-2-engine-5.png"
          },
          {
            "key": "pixel-atlas-2-engine-6",
            "url": "/assets/pixel-fleet/pixel-atlas-2-engine-6.png"
          },
          {
            "key": "pixel-atlas-2-engine-7",
            "url": "/assets/pixel-fleet/pixel-atlas-2-engine-7.png"
          }
        ],
        "muzzleFrames": [
          {
            "key": "pixel-atlas-2-muzzle-0",
            "url": "/assets/pixel-fleet/pixel-atlas-2-muzzle-0.png"
          },
          {
            "key": "pixel-atlas-2-muzzle-1",
            "url": "/assets/pixel-fleet/pixel-atlas-2-muzzle-1.png"
          },
          {
            "key": "pixel-atlas-2-muzzle-2",
            "url": "/assets/pixel-fleet/pixel-atlas-2-muzzle-2.png"
          }
        ],
        "bankFrames": {
          "left": {
            "key": "pixel-atlas-2-bank-left",
            "url": "/assets/pixel-fleet/pixel-atlas-2-bank-left.png"
          },
          "right": {
            "key": "pixel-atlas-2-bank-right",
            "url": "/assets/pixel-fleet/pixel-atlas-2-bank-right.png"
          }
        },
        "unfoldFrames": [
          {
            "key": "pixel-atlas-2-unfold-0",
            "url": "/assets/pixel-fleet/pixel-atlas-2-unfold-0.png"
          },
          {
            "key": "pixel-atlas-2-unfold-1",
            "url": "/assets/pixel-fleet/pixel-atlas-2-unfold-1.png"
          },
          {
            "key": "pixel-atlas-2-unfold-2",
            "url": "/assets/pixel-fleet/pixel-atlas-2-unfold-2.png"
          },
          {
            "key": "pixel-atlas-2-unfold-3",
            "url": "/assets/pixel-fleet/pixel-atlas-2-unfold-3.png"
          }
        ]
      },
      "3": {
        "level": 3,
        "key": "pixel-atlas-3",
        "url": "/assets/pixel-fleet/pixel-atlas-3.png",
        "canvasSize": 192,
        "anchor": {
          "x": 96,
          "y": 96
        },
        "alphaBounds": {
          "x": 6,
          "y": 51,
          "width": 180,
          "height": 96
        },
        "gunMounts": [
          {
            "x": 81,
            "y": 51
          },
          {
            "x": 96,
            "y": 51
          },
          {
            "x": 111,
            "y": 51
          }
        ],
        "engineFrames": [
          {
            "key": "pixel-atlas-3-engine-0",
            "url": "/assets/pixel-fleet/pixel-atlas-3-engine-0.png"
          },
          {
            "key": "pixel-atlas-3-engine-1",
            "url": "/assets/pixel-fleet/pixel-atlas-3-engine-1.png"
          },
          {
            "key": "pixel-atlas-3-engine-2",
            "url": "/assets/pixel-fleet/pixel-atlas-3-engine-2.png"
          },
          {
            "key": "pixel-atlas-3-engine-3",
            "url": "/assets/pixel-fleet/pixel-atlas-3-engine-3.png"
          },
          {
            "key": "pixel-atlas-3-engine-4",
            "url": "/assets/pixel-fleet/pixel-atlas-3-engine-4.png"
          },
          {
            "key": "pixel-atlas-3-engine-5",
            "url": "/assets/pixel-fleet/pixel-atlas-3-engine-5.png"
          },
          {
            "key": "pixel-atlas-3-engine-6",
            "url": "/assets/pixel-fleet/pixel-atlas-3-engine-6.png"
          },
          {
            "key": "pixel-atlas-3-engine-7",
            "url": "/assets/pixel-fleet/pixel-atlas-3-engine-7.png"
          }
        ],
        "muzzleFrames": [
          {
            "key": "pixel-atlas-3-muzzle-0",
            "url": "/assets/pixel-fleet/pixel-atlas-3-muzzle-0.png"
          },
          {
            "key": "pixel-atlas-3-muzzle-1",
            "url": "/assets/pixel-fleet/pixel-atlas-3-muzzle-1.png"
          },
          {
            "key": "pixel-atlas-3-muzzle-2",
            "url": "/assets/pixel-fleet/pixel-atlas-3-muzzle-2.png"
          }
        ],
        "bankFrames": {
          "left": {
            "key": "pixel-atlas-3-bank-left",
            "url": "/assets/pixel-fleet/pixel-atlas-3-bank-left.png"
          },
          "right": {
            "key": "pixel-atlas-3-bank-right",
            "url": "/assets/pixel-fleet/pixel-atlas-3-bank-right.png"
          }
        },
        "unfoldFrames": [
          {
            "key": "pixel-atlas-3-unfold-0",
            "url": "/assets/pixel-fleet/pixel-atlas-3-unfold-0.png"
          },
          {
            "key": "pixel-atlas-3-unfold-1",
            "url": "/assets/pixel-fleet/pixel-atlas-3-unfold-1.png"
          },
          {
            "key": "pixel-atlas-3-unfold-2",
            "url": "/assets/pixel-fleet/pixel-atlas-3-unfold-2.png"
          },
          {
            "key": "pixel-atlas-3-unfold-3",
            "url": "/assets/pixel-fleet/pixel-atlas-3-unfold-3.png"
          }
        ]
      }
    }
  }
];
export function normalizeShipId(value: unknown): ShipId {
  return value === 1 || value === 2 ? value : 0;
}
export function pixelShip(id: unknown): ShipDefinition {
  return SHIPS[normalizeShipId(id)];
}
export const PIXEL_FLEET_IMAGES: readonly FleetImage[] = SHIPS.flatMap(ship =>
  ([1, 2, 3] as const).flatMap(level => {
    const f = ship.levels[level];
    return [f, ...f.engineFrames, ...f.muzzleFrames, f.bankFrames.left,
      f.bankFrames.right, ...f.unfoldFrames];
  }),
);
