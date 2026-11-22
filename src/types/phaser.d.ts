declare namespace Phaser {
  const AUTO: number;

  namespace Scale {
    const FIT: number;
    const RESIZE: number;
    const CENTER_BOTH: number;
  }

  namespace BlendModes {
    const ADD: number;
    const NORMAL: number;
    const MULTIPLY: number;
    const SCREEN: number;
  }

  namespace Math {
    function Clamp(value: number, min: number, max: number): number;
    function Between(min: number, max: number): number;
    function Linear(p0: number, p1: number, t: number): number;
    namespace Distance {
      function Between(x1: number, y1: number, x2: number, y2: number): number;
    }
  }

  namespace GameObjects {
    class Graphics {
      setDepth(value: number): this;
      setBlendMode(key: number | string): this;
      clear(): this;
      fillStyle(color: number, alpha?: number): this;
      fillGradientStyle(topLeft: number, topRight: number, bottomLeft: number, bottomRight: number, alpha?: number): this;
      fillRect(x: number, y: number, width: number, height: number): this;
      fillCircle(x: number, y: number, radius: number): this;
      fillEllipse(x: number, y: number, width: number, height: number): this;
      fillRoundedRect(x: number, y: number, width: number, height: number, radius?: number): this;
      fillTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): this;
      lineStyle(lineWidth: number, color: number, alpha?: number): this;
      lineBetween(x1: number, y1: number, x2: number, y2: number): this;
      strokeCircle(x: number, y: number, radius: number): this;
      strokeEllipse(x: number, y: number, width: number, height: number): this;
      strokeRect(x: number, y: number, width: number, height: number): this;
      beginPath(): this;
      moveTo(x: number, y: number): this;
      lineTo(x: number, y: number): this;
      closePath(): this;
      fillPath(): this;
      strokePath(): this;
      generateTexture(key: string, width?: number, height?: number): this;
      destroy(): void;
      [key: string]: any;
    }

    class Arc {
      x: number;
      y: number;
      setDepth(value: number): this;
      setVisible(value: boolean): this;
      destroy(): void;
      [key: string]: any;
    }

    class Image {
      x: number;
      y: number;
      active: boolean;
      flipX: boolean;
      setDepth(value: number): this;
      setScale(x: number, y?: number): this;
      setFlipX(value: boolean): this;
      destroy(): void;
      [key: string]: any;
    }

    namespace Particles {
      class ParticleEmitter {
        setDepth(value: number): this;
        explode(count?: number, x?: number, y?: number): this;
        emitParticleAt(x?: number, y?: number, count?: number): this;
        destroy(): void;
        [key: string]: any;
      }
    }
  }

  namespace Physics {
    namespace Arcade {
      class Body {
        velocity: { x: number; y: number };
        setSize(width: number, height: number, center?: boolean): this;
        setOffset(x: number, y?: number): this;
        setVelocity(x: number, y?: number): this;
        setVelocityX(value: number): this;
        setVelocityY(value: number): this;
        [key: string]: any;
      }

      class Sprite {
        x: number;
        y: number;
        rotation: number;
        active: boolean;
        flipX: boolean;
        flipY: boolean;
        scaleX: number;
        scaleY: number;
        texture: { key: string };
        body: Body | null;
        setDepth(value: number): this;
        setScale(x: number, y?: number): this;
        setTint(topLeft: number, topRight?: number, bottomLeft?: number, bottomRight?: number): this;
        clearTint(): this;
        setTexture(key: string, frame?: string | number): this;
        setFlipY(value: boolean): this;
        setFlipX(value: boolean): this;
        setVelocity(x: number, y?: number): this;
        setVelocityX(value: number): this;
        setVelocityY(value: number): this;
        setAlpha(value?: number): this;
        destroy(): void;
        [key: string]: any;
      }
    }
  }

  namespace Input {
    namespace Keyboard {
      class Key {
        isDown: boolean;
        [key: string]: any;
      }
    }
  }

  namespace Types {
    namespace Input {
      namespace Keyboard {
        interface CursorKeys {
          up: Phaser.Input.Keyboard.Key;
          down: Phaser.Input.Keyboard.Key;
          left: Phaser.Input.Keyboard.Key;
          right: Phaser.Input.Keyboard.Key;
          space: Phaser.Input.Keyboard.Key;
          shift: Phaser.Input.Keyboard.Key;
        }
      }
    }

    namespace Core {
      interface GameConfig {
        type?: number;
        parent?: HTMLElement | string;
        width?: number | string;
        height?: number | string;
        backgroundColor?: string | number;
        scale?: {
          mode?: number;
          autoCenter?: number;
        };
        physics?: {
          default?: string;
          arcade?: {
            gravity?: { x?: number; y?: number };
            debug?: boolean;
          };
        };
        scene?: any;
        [key: string]: any;
      }
    }
  }

  class Scene {
    constructor(config?: string | { key?: string });
    add: {
      graphics(config?: any): Phaser.GameObjects.Graphics;
      circle(x?: number, y?: number, radius?: number, fillColor?: number, fillAlpha?: number): Phaser.GameObjects.Arc;
      image(x: number, y: number, texture: string, frame?: string | number): Phaser.GameObjects.Image;
      particles(x: number, y: number, texture: string, config?: any): Phaser.GameObjects.Particles.ParticleEmitter;
      [key: string]: any;
    };
    physics: {
      add: {
        sprite(x: number, y: number, texture: string, frame?: string | number): Phaser.Physics.Arcade.Sprite;
        [key: string]: any;
      };
      [key: string]: any;
    };
    textures: {
      exists(key: string): boolean;
      [key: string]: any;
    };
    cameras: {
      main: {
        scrollX: number;
        scrollY: number;
        setBounds(x: number, y: number, width: number, height: number): any;
        centerOn(x: number, y: number): any;
        startFollow(target: any, roundPixels?: boolean, lerpX?: number, lerpY?: number): any;
        shake(duration?: number, intensity?: number): any;
        [key: string]: any;
      };
      [key: string]: any;
    };
    input: {
      keyboard: {
        createCursorKeys(): Phaser.Types.Input.Keyboard.CursorKeys;
        addKeys(keys: string): any;
        on(event: string, fn: (...args: any[]) => void): any;
        [key: string]: any;
      } | null;
      [key: string]: any;
    };
    time: {
      timeScale: number;
      addEvent(config: any): any;
      delayedCall(delay: number, callback: (...args: any[]) => void): any;
      [key: string]: any;
    };
    tweens: {
      add(config: any): any;
      [key: string]: any;
    };
    [key: string]: any;
  }

  class Game {
    constructor(config?: Phaser.Types.Core.GameConfig);
    scene: {
      pause(key: string): void;
      resume(key: string): void;
      [key: string]: any;
    };
    destroy(removeCanvas: boolean, noReturn?: boolean): void;
    [key: string]: any;
  }
}
