module.exports = function(Course) {

    Course.handleRoom = function(courseId, cb) {
        console.log('ID?', courseId);
        var io = Course.app.io;
        
        Course.findById(courseId, function(err, course) {
            if (err) {
                console.log(err);
                cb(err, 'Error!');
            }

            console.log(course);
            
            cb(null, 'Here you are!');
        });        

    }

    Course.remoteMethod('handleRoom', {
        accepts: {arg: 'courseId', type: 'string'},
        returns: {arg: 'response', type: 'string'}
    });

};
