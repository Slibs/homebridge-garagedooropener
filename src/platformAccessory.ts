import {
  API,
  Logger,
  AccessoryConfig,
  Service,
  AccessoryPlugin,
} from 'homebridge';
import GPIO from 'rpi-gpio';

export class GarageDoorOpenerAccessory implements AccessoryPlugin {
  private garageDoor: Service;
  private readonly relayPin: number;
  private readonly openSensorPin: number;
  private readonly closedSensorPin: number;

  private currentDoorState = this.api.hap.Characteristic.CurrentDoorState.CLOSED;
  private targetDoorState = this.api.hap.Characteristic.CurrentDoorState.CLOSED;

  constructor(
    public readonly log: Logger,
    public readonly accessory: AccessoryConfig,
    public readonly api: API,
  ) {
    this.log.debug('GarageDoorOpenerAccessory is initializing.');

    this.relayPin = 4; // GPIO pin for relay
    this.openSensorPin = 23; // GPIO pin for open sensor
    this.closedSensorPin = 18; // GPIO pin for closed sensor

    // Initialize GPIO
    GPIO.setup(this.relayPin, GPIO.DIR_OUT);
    GPIO.setup(this.openSensorPin, GPIO.DIR_IN, GPIO.EDGE_BOTH);
    GPIO.setup(this.closedSensorPin, GPIO.DIR_IN, GPIO.EDGE_BOTH);

    this.log.debug('GarageDoorOpenerAccessory GPIO initialized.');

    // Configure characteristics
    this.garageDoor = new this.api.hap.Service.GarageDoorOpener(this.accessory.name || 'GarageDoor');
    this.garageDoor.getCharacteristic(this.api.hap.Characteristic.CurrentDoorState)
      .onGet(this.getCurrentState.bind(this));
    this.garageDoor.getCharacteristic(this.api.hap.Characteristic.TargetDoorState)
      .onSet(this.getTargetState.bind(this))
      .onGet(this.getTargetState.bind(this));
    this.garageDoor.getCharacteristic(this.api.hap.Characteristic.ObstructionDetected)
      .onGet(() => false);

    this.log.debug('GarageDoorOpenerAccessory characteristics configured.');

    GPIO.on('change', (channel, value) => {
      if (channel === this.closedSensorPin) {
        this.handleClosedSensorChange(value);
      } else if (channel === this.openSensorPin) {
        this.handleOpenSensorChange(value);
      }
    });
    this.log.info('GarageDoorOpenerAccessory is initializing done.');
  }

  getServices(): Service[] {
    return [this.garageDoor];
  }

  getCurrentState() {
    return this.currentDoorState;
  }

  setTargetState() {
    this.log.info('Target State Trigered');

    if (this.currentDoorState === this.api.hap.Characteristic.CurrentDoorState.CLOSED) {
      // If the door is currently closed, set the target state to open
      this.targetDoorState = this.api.hap.Characteristic.CurrentDoorState.OPEN;
    } else if (this.currentDoorState === this.api.hap.Characteristic.CurrentDoorState.OPEN) {
      // If the door is currently open, set the target state to closed
      this.targetDoorState = this.api.hap.Characteristic.CurrentDoorState.CLOSED;
    } else {
      // If the door is currently opening or closing, set the target state to stopped
      this.targetDoorState = this.api.hap.Characteristic.CurrentDoorState.STOPPED;
    }

    this.triggerRelay();
    this.updateDoorStateCharacteristic();
  }

  getTargetState() {
    return this.targetDoorState;
  }

  private handleOpenSensorChange(value: boolean) {
    this.log.debug('Open sensor change detected');

    if (value) {
      // Raising edge (Door is open)
      this.currentDoorState = this.api.hap.Characteristic.CurrentDoorState.OPEN;
      this.updateDoorStateCharacteristic();
    } else {
      // Falling edge (Door is opening)
      this.currentDoorState = this.api.hap.Characteristic.CurrentDoorState.OPENING;
      this.updateDoorStateCharacteristic();
    }
  }

  private handleClosedSensorChange(value: boolean) {
    this.log.debug('Closed sensor change detected');

    if (value) {
      // Raising edge (Door is closed)
      this.currentDoorState = this.api.hap.Characteristic.CurrentDoorState.CLOSED;
      this.updateDoorStateCharacteristic();
    } else {
      // Falling edge (Door is closing)
      this.currentDoorState = this.api.hap.Characteristic.CurrentDoorState.CLOSING;
      this.updateDoorStateCharacteristic();
    }
  }

  private updateDoorStateCharacteristic() {
    this.garageDoor.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.currentDoorState);
    this.garageDoor.updateCharacteristic(this.api.hap.Characteristic.TargetDoorState, this.targetDoorState);
  }

  private triggerRelay() {
    this.log.debug('Triggering relay...');
    // Implement the logic to trigger the relay here
    // For example, you can use a GPIO output to trigger the relay for 250ms
    GPIO.write(this.relayPin, true, (err) => {
      if (err) {
        this.log.error(`Error triggering relay: ${err}`);
      } else {
        setTimeout(() => {
          GPIO.write(this.relayPin, false, () => {});
        }, 250);
      }
    });
  }
}
