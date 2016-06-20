var Ear = Ear || {}

Ear.prototype.Normalizer  = function(ear, options){
    options = options || {};
    this.ear = ear;

    this.dynamic = options.dynamic || false; //if true max and min values will follow the average values
    this.damping = options.damping || 1; //how fast the dynamic values should change
    this.overflow = options.overflow || false; //allow value to overflow 1 when there is a higher input than normal

    this.maximum = 0;
    this.minimum = 0;
    this.current = 0;
}

Ear.prototype.Normalizer.prototype = {
    normalize : function(value) {
        if(this.dynamic){

        } else {
            if(value > this.maximum){
                this.maximum = value;
            }
        }
        
    }
}