import {
  CharacteristicSetCallback,
  CharacteristicValue,
  Service,
  PlatformAccessory,
} from 'homebridge';
import { GarageDoorOpenerHomebridgePlugin } from './platform';
import * as GPIO from 'rpi-gpio';

export class GarageDoorOpenerPlatformAccessory {
  private garageDoor: Service;
  private readonly relayPin: number;
  private readonly openSensorPin: number;
  private readonly closedSensorPin: number;

  private currentDoorState = this.platform.Characteristic.CurrentDoorState.CLOSED;
  private targetDoorState = this.platform.Characteristic.CurrentDoorState.CLOSED;

  constructor(
    private readonly platform: GarageDoorOpenerHomebridgePlugin,
    private readonly accessory: PlatformAccessory,
  ) {
  // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    this.relayPin = 4; // GPIO pin for relay
    this.openSensorPin = 23; // GPIO pin for open sensor
    this.closedSensorPin = 18; // GPIO pin for closed sensor

    // Initialize GPIO
    GPIO.setup(this.relayPin, GPIO.DIR_OUT);
    GPIO.setup(this.openSensorPin, GPIO.DIR_IN, GPIO.EDGE_BOTH);
    GPIO.setup(this.closedSensorPin, GPIO.DIR_IN, GPIO.EDGE_BOTH);

    this.setupEventsGPIO();

    this.garageDoor = this.accessory.getService(this.platform.Service.GarageDoorOpener)
    || this.accessory.addService(this.platform.Service.GarageDoorOpener);
    this.garageDoor.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);

    this.garageDoor.getCharacteristic(this.platform.Characteristic.CurrentDoorState)
      .onGet(this.getCurrentState.bind(this));
    this.garageDoor.getCharacteristic(this.platform.Characteristic.TargetDoorState)
      .onSet(this.setTargetState.bind(this))
      .onGet(this.getTargetState.bind(this));
    this.garageDoor.getCharacteristic(this.platform.Characteristic.ObstructionDetected)
      .onGet(this.getObstruction.bind(this));
  }

  private setupEventsGPIO(){
    return;
  }

  private handleOpenSensorChange(value: boolean) {
    if (value) {
      // Raising edge (Door is open)
      this.currentDoorState = this.platform.Characteristic.CurrentDoorState.OPEN;
      this.updateDoorStateCharacteristic();
    } else {
      // Falling edge (Door is opening)
      this.currentDoorState = this.platform.Characteristic.CurrentDoorState.OPENING;
      this.updateDoorStateCharacteristic();
    }
  }

  private handleClosedSensorChange(value: boolean) {
    if (value) {
      // Raising edge (Door is closed)
      this.currentDoorState = this.platform.Characteristic.CurrentDoorState.CLOSED;
      this.updateDoorStateCharacteristic();
    } else {
      // Falling edge (Door is closing)
      this.currentDoorState = this.platform.Characteristic.CurrentDoorState.CLOSING;
      this.updateDoorStateCharacteristic();
    }
  }

  private updateDoorStateCharacteristic() {
    this.garageDoor.updateCharacteristic(this.platform.Characteristic.CurrentDoorState, this.currentDoorState);
  }

  getCurrentState(){
    return false;
  }

  setTargetState(value: CharacteristicValue, callback: CharacteristicSetCallback){
    // Close or open the door based on the button press
    this.targetDoorState = value as number;
    this.triggerRelay();

    callback(null);
  }

  getTargetState(){
    return this.targetDoorState;
  }

  getObstruction(){
    return false;
  }

  private triggerRelay() {
    return;
  }
}
