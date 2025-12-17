/**
 * MQTT Configuration
 * Define all MQTT topics here
 */

const TOPICS = {
  // Personal Management
  PERSONAL: {
    personCreate: {
      device: '20211214/cmd/{#deviceSn}/personCreate',
      reply: '20211214/cmd/personCreate_reply',
    },
    personDelete: {
      device: '20211214/cmd/{#deviceSn}/personDelete',
      reply: '20211214/cmd/personDelete_reply',
    },
    personFind: {
      device: '20211214/cmd/{#deviceSn}/personFind',
      reply: '20211214/cmd/personFind_reply',
    },
    whiteListSync: {
      device: '20211214/cmd/{#deviceSn}/whiteListSync',
      reply: '20211214/cmd/whiteListSync_reply',
    },
    whiteListFind: {
      device: '20211214/cmd/{#deviceSn}/whiteListFind',
      reply: '20211214/cmd/whiteListFind_reply',
    },
    registerFeats: {
      device: '20211214/cmd/{#deviceSn}/registerFeats',
      reply: '20211214/cmd/registerFeats_reply',
    },
  },

  // Identification Records
  RECORDS: {
    deleteRecords: {
      device: '20211214/cmd/{#deviceSn}/deleteRecords',
      reply: '20211214/cmd/deleteRecords_reply',
    },
    findRecords: {
      device: '20211214/cmd/{#deviceSn}/findRecords',
      reply: '20211214/cmd/findRecords_reply',
    },
    reportRecords: {
      device: '20211214/event/{#deviceSn}/reportRecords',
      reply: '20211214/event/reportRecords_reply',
    },
  },

  // Device Management
  DEVICE: {
    setConfig: {
      device: '20211214/cmd/{#deviceSn}/setConfig',
      reply: '20211214/cmd/setConfig_reply',
    },
    getConfig: {
      device: '20211214/cmd/{#deviceSn}/getConfig',
      reply: '20211214/cmd/getConfig_reply',
    },
    setNetInfo: {
      device: '20211214/cmd/{#deviceSn}/setNetInfo',
      reply: '20211214/cmd/setNetInfo_reply',
    },
    setTime: {
      device: '20211214/cmd/{#deviceSn}/setTime',
      reply: '20211214/cmd/setTime_reply',
    },
    restartDevice: {
      device: '20211214/cmd/{#deviceSn}/restartDevice',
      reply: '20211214/cmd/restartDevice_reply',
    },
    deviceReset: {
      device: '20211214/cmd/{#deviceSn}/deviceReset',
      reply: '20211214/cmd/deviceReset_reply',
    },
    deviceDisable: {
      device: '20211214/cmd/{#deviceSn}/deviceDisable',
      reply: '20211214/cmd/deviceDisable_reply',
    },
    deviceUpgrade: {
      device: '20211214/cmd/{#deviceSn}/deviceUpgrade',
      reply: '20211214/cmd/deviceUpgrade_reply',
    },
    deviceInformation: {
      device: '20211214/cmd/{#deviceSn}/deviceInformation',
      reply: '20211214/cmd/deviceInformation_reply',
    },
    cameraCalibrate: {
      device: '20211214/cmd/{#deviceSn}/cameraCalibrate',
      reply: '20211214/cmd/cameraCalibrate_reply',
    },
    control: {
      device: '20211214/cmd/{#deviceSn}/control',
      reply: '20211214/cmd/control_reply',
    },
    extractLog: {
      device: '20211214/cmd/{#deviceSn}/extractLog',
      reply: '20211214/cmd/extractLog_reply',
    },
    password: {
      device: '20211214/cmd/{#deviceSn}/password',
      reply: '20211214/cmd/password_reply',
    },
  },

  // Events
  EVENTS: {
    alarm: {
      device: '20211214/event/{#deviceSn}/alarm',
      reply: '20211214/event/alarm_reply',
    },
    heartbeat: {
      device: '20211214/event/{#deviceSn}/heartbeat',
      reply: '20211214/event/heartbeat_reply',
    },
    lwt: {
      device: '20211214/event/{#deviceSn}/lwt',
      reply: '20211214/event/lwt_reply',
    },
    connect: {
      device: '20211214/event/connect',
      reply: '20211214/event/connect_reply',
    },
    dcs: {
      device: '20211214/event/{#deviceSn}/dcs',
      reply: '20211214/event/dcs_reply',
    },
    onlineCheck: {
      device: '20211214/event/{#deviceSn}/onlineCheck_reply',
      reply: '20211214/event/onlineCheck',
    },
  },

  // User Password Management
  USERPASSWORD: {
    add: {
      device: '20211214/cmd/{#deviceSn}/userpassword/add',
      reply: '20211214/cmd/userpassword/add_reply',
    },
    delete: {
      device: '20211214/cmd/{#deviceSn}/userpassword/del',
      reply: '20211214/cmd/userpassword/del_reply',
    },
    find: {
      device: '20211214/cmd/{#deviceSn}/userpassword/find',
      reply: '20211214/cmd/userpassword/find_reply',
    },
  },

  // Secret Sync (Dynamic Code for VG103)
  SECRET: {
    secretSync: {
      device: '20211214/cmd/{#deviceSn}/secretSync',
      reply: '20211214/cmd/secretSync_reply',
    },
  },
};

// Subscribe topics (dengan wildcard untuk multi-device)
const SUBSCRIBE_TOPICS = [
  // Personal management
  '20211214/cmd/+/personCreate',
  '20211214/cmd/+/personDelete',
  '20211214/cmd/+/personFind',
  '20211214/cmd/+/whiteListSync',
  '20211214/cmd/+/whiteListFind',
  '20211214/cmd/+/registerFeats',

  // Records
  '20211214/cmd/+/deleteRecords',
  '20211214/cmd/+/findRecords',
  '20211214/event/+/reportRecords',

  // Device management
  '20211214/cmd/+/setConfig',
  '20211214/cmd/+/getConfig',
  '20211214/cmd/+/setNetInfo',
  '20211214/cmd/+/setTime',
  '20211214/cmd/+/restartDevice',
  '20211214/cmd/+/deviceReset',
  '20211214/cmd/+/deviceDisable',
  '20211214/cmd/+/deviceUpgrade',
  '20211214/cmd/+/deviceInformation',
  '20211214/cmd/+/cameraCalibrate',
  '20211214/cmd/+/control',
  '20211214/cmd/+/extractLog',
  '20211214/cmd/+/password',

  // User password
  '20211214/cmd/+/userpassword/add',
  '20211214/cmd/+/userpassword/del',
  '20211214/cmd/+/userpassword/find',

  // Secret
  '20211214/cmd/+/secretSync',

  // Events
  '20211214/event/+/alarm',
  '20211214/event/+/heartbeat',
  '20211214/event/+/lwt',
  '20211214/event/+/dcs',
  '20211214/event/+/onlineCheck_reply',
  '20211214/event/connect',
];

module.exports = {
  TOPICS,
  SUBSCRIBE_TOPICS,
};
