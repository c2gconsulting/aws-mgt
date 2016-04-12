var AWS = require('aws-sdk');
var _ = require('underscore');
//var logger = require('./shared/lib/log');
var config = require('./config.json');
var region = process.argv[2] || 'eu-central-1';
//set region
AWS.config.update({region: region});


var ec2 = new AWS.EC2();  
var instance = {
    DryRun: false,
    Filters: [
        {
            Name: 'instance-state-name',
            Values: [
                'running'
            ],
        },
        {
            Name: 'tag-value',
            Values: config.instanceFilter,
        },
    ]
};

//descibe instances 
var instances;
ec2.describeInstances(instance, function(error, data) {
  if (error) {
    console.log(error); // an error occurred
  } else {
    instances = data.Reservations;
    for(var i=0;i<instances.length;i++){
      var currentInstance = instances[i].Instances[0].InstanceId
      var EBSDevices = instances[i].Instances[0].BlockDeviceMappings;
      var volumeId = [];  var rootDevice = [];
      var tag = instances[i].Instances[0].Tags; // get all tags of instances
      //get the name tag 
      var index = _.findLastIndex(tag, {Key: 'Name'});
      var nameTag = tag[index].Value;
      for(var j=0;j<EBSDevices.length;j++){
        volumeId[j] = EBSDevices[j].Ebs.VolumeId;
        rootDevice[j] = EBSDevices[j].DeviceName;
        createSnapshotFromVolume(volumeId[j], rootDevice[j], nameTag);
      }
    }
  }
});

function createSnapshotFromVolume(volumeId, rootDevice, nameTag){
  var todaySnapshot = false;
  //populate time for snapshot life span
  var timestampLimit = (config.keepDay * 24 * 60 * 60 * 1000);  
          var volumeFilter = {  
            DryRun: false,
            Filters: [
                      {
                        Name: 'volume-id',
                        Values: [volumeId]
                      }
                    ]
        };
          ec2.describeSnapshots(volumeFilter, function(err, data) {  
          if (err){
            console.log(err, err.stack); // an error occurred
          } 
          else {
              for (var j=0;j<data.Snapshots.length;j++) {
                  var creation = data.Snapshots[j].StartTime;
                  var createdTimestamp = new Date(creation).getTime();
                  var lifeSpan = createdTimestamp + timestampLimit;
                  var timestampNow = new Date().getTime();
                  if (timestampNow > lifeSpan && snapshotImageFromDescription(data.Snapshots[j].Description)) {
                      console.log(data.Snapshots[j].SnapshotId + ' ' + data.Snapshots[j].Description + ' is due for removal... ');
                      removeSnapshot(data.Snapshots[j].SnapshotId);
                  }
                  //check if snapshot has been created today for this volume
                  var today = new Date(); 
                  var created = new Date(creation);
                  var backup = (today.toDateString() == created.toDateString());
                  if (backup) {
                    todaySnapshot = true; 
                    console.log('snapshot ' + data.Snapshots[j].SnapshotId + ' was created today');
                  }
                  if (j == data.Snapshots.length -1){
                     //Check if todays snapshot exist and create snapshot if not 
                      if (!todaySnapshot) {
                        console.log('snapshot not created for volume ' + volumeId + ' today will now proceed to backup');
                        createSnapshot(volumeId, rootDevice, nameTag);
                      }
                  }

              }
              
          }
        });
}

function snapshotImageFromDescription(description){
  if (description.indexOf(config.snapshotDescription) == 0) {
    return true; } else {
      return false;
    }
}

function createSnapshot(volume_id, mount, name){  
  var date = new Date().toDateString();
  //var snapname = name + '@' + date
    var params = {
      VolumeId: volume_id,
      Description: config.snapshotDescription + ' for ' + name + ' mount on ' + mount + ' ' + date, 
      DryRun: false
    };

    ec2.createSnapshot(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else {
        console.log('snapshot request sent for ' + name + ' Voulume ' + volume_id);
          //notify admin of successful snapshot.
      }
    });
}

function removeSnapshot(id) {  
    var params = {
      SnapshotId: id, 
      DryRun: false
    };
    ec2.deleteSnapshot(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else {
          //notify admin of deleted snapshot
          console.log('Snapshot ' + id + ' deleted');
      }
    });
}