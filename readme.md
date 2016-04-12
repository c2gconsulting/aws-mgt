# Aws-Mgt

The Aws-Mgt node js app built upon the aws sdk for javascript.
IT is developed to be scheduled to run daily and send reports to any administrative email account

### Aws-Mgt contains the following sub components 
- [ec2-maintainer](https://github.com/c2gconsulting/aws-mgt/tree/master/ec2-maintainer)
	refer to the ec2-maintainer section below for more details.

### Contributing to Aws-Mgt

Download and Install the following:
	
- [Node.js](http://nodejs.org/download/) 
- [Git](http://git-scm.com/downloads)

Clone the Aws-Mgt Repository 

    $cd <your local development directory>
    $git clone ttps://github.com/c2gconsulting/aws-mgt.git

Create a branch for the task you want to work on

    $git checkout -b <my-branch>

Make changes to your work, **test locally**. Once you are comfortable with your work, `add`, `commit` and `push` to github.

    $git add .
    $git commit -m '<brief title for changes made>'
    $git fetch
    $git merge origin/<my-branch>
    $git push -u origin <my-branch>

Create a [Pull-Request](https://help.github.com/articles/using-pull-requests/) so that the repository manager(s) can review your code

### The ec2-maintainer

To Run the ec2-maintainer script, from your ec2-maintainer app directory run: 

	$AWS_PROFILE=profile node app.js 'region'
    $AWS_PROFILE=default node app.js 'us-east-1'

Tag your instances e.g. with key: 'Name' and Value: 'NAV.PROD.001'

Add instances in which you want to schedule snapshots in ec2-maintainer/config.json as:

	"instanceFilter": ["NAV.PROD.001", "SQL.PROD.001"]

Specify Number of days the snapshots are to be kept:

	"keepDay": 7

Specify snapshot description 
	
	"snapshotDescription": "Created by ec2-maintainer"

The snapshot description is used to identify the snapshots created by the ec2-maintainer script,	