window.Term_Project = window.classes.Term_Project =
class Term_Project extends Scene_Component
{ 
  constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
  { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
    if( !context.globals.has_controls   ) 
      context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) ); 

    // Initial Camera Position
    context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,0,25 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) );
    this.initial_camera_location = Mat4.inverse( context.globals.graphics_state.camera_transform );

    const r = context.width/context.height;
    context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );
    //context.globals.graphics_state.projection_transform = Mat4.orthographic()   // Orthographic camera??  DELETE

    // Available Shapes
    const shapes = {
                      triangle:       new Triangle(),
                      square:         new Square(),
                      tetrahedron:    new Tetrahedron(),
                      windmill:       new Windmill(),
                      cube:           new Cube(),
                      cubeOuline:     new Cube_Outline(),
                      line:           new Line_Segment_Array(),
                      sphere:         new Subdivision_Sphere(4),
                      gridSphere:     new Grid_Sphere(10, 10),
                      //grid:           new Grid_Patch(10, 10),
                      torus:          new Torus(),
                      closedCone:     new Closed_Cone(30, 30),
                      cappedCylinder: new Capped_Cylinder(30, 30),
                      roundedCylinder:new Rounded_Capped_Cylinder(30, 30),
                      axis:           new Axis_Arrows(),
                      text:           new Text_Line(24),
                      bird:           new Shape_From_File("assets/bird.obj"),
                      rock:          new Shape_From_File("assets/rock.obj"),
                      boat:           new Shape_From_File("assets/boat.obj"),
                      mainPipe:       new Main_Pipe(30, 30),
                      pipeTip:        new Pipe_Tip(30, 30)
                   }  
    this.submit_shapes( context, shapes );


    // Available Materials
    this.materials =
                    { 
                      phong: context.get_instance( Phong_Shader ).material( Color.of( 1,1,0,1 ) ), // Parameters: shader, color, ambient, diffusivity, specularity, smoothnes
                      bird: context.get_instance( Phong_Shader ).material( this.basicColors('yellow'), {ambient: 0.1, diffusivity: 0.8, specularity: 0.2} ),
                      collision: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), {ambient: 1, texture: context.get_instance( "assets/collision.png")} ),
                      rock: context.get_instance( Phong_Shader ).material( Color.of(0.50196, 0.517647, 0.52941, 1), {ambient: 0.1, diffusivity: 0.8, specularity: 0.2} ),
                      boat: context.get_instance( Phong_Shader ).material( this.basicColors('gray', 0.9) ),
                      pipe: context.get_instance( Phong_Shader ).material( this.basicColors('green'), {ambient: 0.1, diffusivity: 0.5, specularity: 0.7} ),
                      background: context.get_instance( Scroll_X ).material( Color.of( 0,0,0,1 ), {ambient: 1, texture: context.get_instance("assets/seamlessSky.jpg")} ),
                      forest: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), {ambient: 1, diffusivity: 0.5, specularity: 0.2, texture: context.get_instance("assets/forest.png")} ),
                      grass: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), {ambient: 1, texture: context.get_instance( "assets/grass.jpg")} ),
                      ocean: context.get_instance( Scroll_X ).material( Color.of( 0,0,0,1 ), {ambient: 1, diffusivity: 1, specularity: 1, texture: context.get_instance( "assets/ocean.jpg")} ),
                      bumped_ocean: context.get_instance( Scroll_X_Bump ).material( Color.of( 0,0,0,1 ), {ambient: 1, diffusivity: 1, specularity: 1, texture: context.get_instance( "assets/ocean.jpg"), texture2: context.get_instance( "assets/ocean.jpg")} ),
                      sky: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), {ambient: 1, texture: context.get_instance( "assets/sky.png")} ),
                      sun: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), {ambient: 1, texture: context.get_instance( "assets/sunJoke.png")} ),
                      text_image: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, diffusivity: 0, specularity: 0, texture: context.get_instance( "assets/text.png" ) } )
                    }


    // Available Sounds
    this.sounds = {
                    birdflap: new Audio('assets/birdflap.wav'),
                    BG: new Audio('assets/BG.mp3'),
                    bounce: new Audio('assets/bounce.wav'),
                    crash: new Audio('assets/crash.mp3'),
                    crashGround: new Audio('assets/crashGround.wav'),
                    crashWater: new Audio('assets/crashWater.wav'),
                    point: new Audio('assets/point.wav'),
                    oceanAmbient: new Audio('assets/ocean.wav'),
                    quack: new Audio('assets/quack.wav'),
                    PP: new Audio('assets/pp.wav')
                  };
     
     // Game states
     this.states = {
                      startScreen: 0,
                      play:        1,
                      pause:       2,
                      gameOver:    3
                   };


    /****************
      Class Variables
    ****************/
    this.onLoad = true;
    this.showBoundaries = false; // DELETE
    this.maxHeight = 10;
    this.maxWidth = 18;
    this.state = this.states.startScreen

    // Background for Sky
    this.backgroundSize = 500
                  
    // Ground
    this.groundSize = this.backgroundSize / 5
    this.groundLevel = -this.maxHeight

    // Forest
    this.forests = []
    this.sideForests = []
    this.forestSize = this.backgroundSize/24
    this.forestXTranslation = 0
    this.spawnForest()

    // Boats
    this.boats = []
    this.boatSpawnFrequency = 750
    this.maxBoats = 5
    this.boatSize = 4

    // Rocks
    this.rocks = []
    this.rockSpawnFrequency = 500
    this.maxRocks = 15
    this.rockSize = 4

    // Score
    this.score = 0.0
    this.finalScore = 0.0

    // Bird
    this.birdPositionOriginal = this.birdPosition = Mat4.identity().times(Mat4.rotation(Math.PI/2, [0, 1, 0]));
    this.birdPositionHeight = this.birdPosition[1][3];
    this.birdAcceleration = -0.25 / 60;
    this.birdSpeed = 0.0;
    this.collisionAnimationTime = 0

    // Pipes
    this.pipePositionBottom = Mat4.identity().times(Mat4.translation([this.maxWidth + 25, -(this.maxHeight - 1), 0])).times(Mat4.rotation(Math.PI/2, [1, 0, 0]));
    this.pipePositionUpper = Mat4.identity().times(Mat4.translation([this.maxWidth + 25, this.maxHeight, 0])).times(Mat4.rotation(Math.PI/2, [1, 0, 0]));
    this.pipes = []; // Each element, a pipe, holds [0] = its position (Mat4), [1] = its speed, [2] = its X coordinate, [3] = its height, [4] = 'top' or 'bottom'
    this.distanceTraveled = 0.0;
    this.pipeSpeed = -5.0;    // this is actually the number we divide 1 by to obtain pipe speed, did this to avoid rounding error
    this.minPipeHeight = 4;   // Both minPipeHeight and maxPipeHeight refer to bottom pipe
    this.maxPipeHeight = 16;

    // Camera
    this.initialDynamicPosition = [0,   0, 25]
    this.finalDynamicPosition   = [-10, 5, 10]
    this.dynamic = Mat4.inverse(Mat4.look_at( Vec.of(0, 0, -15 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ));
    this.cameraPositions = {
                            center: this.initial_camera_location,
                            right: Mat4.inverse(Mat4.look_at( Vec.of( 10,0,25 ), Vec.of( 10,0,0 ), Vec.of( 0,1,0 ) )),
                            behind: Mat4.inverse(Mat4.look_at( Vec.of( -20,5,10 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) )),
                            dynamic: this.dynamic
                           };
    this.currentCamera = this.cameraPositions.center;
    this.cameraTextString = "Center";
  }

  reset()
  {
    this.state = this.states.startScreen
    this.birdPosition = this.birdPositionOriginal
    this.birdSpeed = 0.0
    this.score = 0.0
    this.movePipes('reset')
  }

  endGame()
  {
    this.state = this.states.gameOver
    this.finalScore = this.score
    //this.currentCamera = this.cameraPositions.center  // Uncomment to reset camera angle at death 
  }

  switchCamera(position)
  { 
    if (this.cameraPositions[position] != undefined)
      this.currentCamera = this.cameraPositions[position]
    else 
      switch (this.currentCamera)
      {
       case this.cameraPositions.center:
        this.currentCamera = this.cameraPositions.right
        this.cameraTextString = "Right";
        break

      case this.cameraPositions.right:
        this.currentCamera = this.cameraPositions.behind
        this.cameraTextString = "Behind";
        break

       case this.cameraPositions.behind:
        this.currentCamera = this.cameraPositions.dynamic
        this.cameraTextString = "Dynamic";
        break

       default:
        this.currentCamera = this.cameraPositions.center
        this.cameraTextString = "Center";
        
      }
  }

  /**************************************************************
    Returns a chosen color with the specified opacity (0.0 - 1.0)
    If color is not found, returns white
    If opacity is not of range, returns opaque (opacity = 1.0)
  **************************************************************/
  basicColors(color, opacity = 1)
  {
    if(opacity < 0.0 || opacity > 1.0)
      opacity = 1.0;

    switch (color)
    {
      case 'red':     return Color.of(1, 0, 0, opacity);
      case 'green':   return Color.of(0, 1, 0, opacity);
      case 'blue':    return Color.of(0, 0, 1, opacity);
      case 'yellow':  return Color.of(1, 1, 0, opacity);
      case 'orange':  return Color.of(1, 0.6471, 0, opacity);
      case 'cyan':    return Color.of(0, 1, 1, opacity);
      case 'magenta': return Color.of(1, 0, 1, opacity);
      case 'gray':    return Color.of(0.5, 0.5, 0.5, opacity);
      case 'maroon':  return Color.of(0.5, 0, 0, opacity);
      case 'purple':  return Color.of(0.5, 0, 0.5, opacity);
      case 'black':   return Color.of(0, 0, 0, opacity);
      case 'white':   return Color.of(1, 1, 1, opacity);
      case 'brown':   return Color.of(0.8, 0.52, 0.24, opacity);

      default:      return Color.of(1, 1, 1, 1);
    }
  }



  /**************
    Control Panel
  **************/
  make_control_panel()
  { 
    this.key_triggered_button( "Jump",            [ "j" ], () => { 
                                                                   switch (this.state)
                                                                   {
                                                                     case this.states.gameOver:
                                                                      this.reset()
                                                                      this.state = this.states.startScreen
                                                                      break

                                                                     case this.states.startScreen:
                                                                      this.state = this.states.play
                                                                      this.moveBird('jump')
                                                                      break;

                                                                     case this.states.play:
                                                                      this.moveBird('jump')
                                                                   } 
                                                                 } );
//     this.new_line();
//     this.key_triggered_button( "Pause",    [ "h" ], () => { this.playSound('PP'); switch (this.state)
//                                                                    {
//                                                                      case this.states.play:
//                                                                       this.state = this.states.pause
//                                                                       break

//                                                                      case this.states.pause:
//                                                                       this.state = this.states.play
//                                                                       break;
//                                                                    } 
//                                                           } );
//      Let's just avoid this for now because this is gonna require me to redo how the sky and ground scrolls
//      Plus, I dont think its that necessary and the original game doesnt have it 

    this.key_triggered_button( "Quack",           [ "q" ], () => { this.playSound('quack') } );
    this.new_line()
    this.key_triggered_button( "Switch Camera",   [ "c" ], () => { this.switchCamera() } );
    this.new_line()
    this.key_triggered_button( "Mute Music",      [ "m" ], () => { this.playSound('BG', undefined, 'mute') } );
    this.new_line()
    this.key_triggered_button( "Reset",           [ "g" ], () => { this.playSound('PP'); this.reset() } );
    this.new_line();
    this.key_triggered_button( "Show Boundaries", [ "b" ], () => { this.showBoundaries = !this.showBoundaries } );     // DELETE

    /* FOR REFERENCE
    this.key_triggered_button( "Change Colors", [ "c" ], this.set_colors );    // Add a button for controlling the scene.


    this.key_triggered_button( "Outline",[ "o" ], () => {
                                                          this.outline = !this.outline
                                                        } )
      
    this.key_triggered_button( "View solar system",  [ "0" ], () => this.attached = () => this.initial_camera_location );
    */
  }



  /***************************************************************************
    Moves the bird specified by the parameter (up, down, jump, gravity, reset)
    Limits the movement to +- 10 from origin
  ***************************************************************************/
  moveBird(direction)
  {
    switch(direction)
    {
      case 'up':
        if ( this.birdPositionHeight < this.maxHeight)
          this.birdPosition = this.birdPosition.times(Mat4.translation([0, 1, 0]))
        break;


      case 'down':
        if ( this.birdPositionHeight > -1 * this.maxHeight)
          this.birdPosition = this.birdPosition.times(Mat4.translation([0, -1, 0]))
        break;


      case 'jump':
        var offset = 0.0005 * this.birdPositionHeight // Offset intended to make the jump less excessive as it approaches max height 
                                                      // and more excessive as it approaches -max height
        this.birdSpeed += 0.3 - offset
        this.playSound("birdflap")
        break;


      case 'gravity':
        if ( this.birdPositionHeight < this.maxHeight && this.birdPositionHeight > this.groundLevel + 2)
        {
          var offset = 0                      // Meant to increase the acceleration(gravity) as bird approaches max height to make game feel more dynamic
          if (this.birdPositionHeight > -5)
            offset = -0.0015 * Math.abs(this.birdPositionHeight)

          this.birdSpeed += this.birdAcceleration + offset;
          this.birdPosition = this.birdPosition.times(Mat4.translation([0, this.birdSpeed, 0]))
        }

        else if (this.birdPositionHeight >= this.maxHeight)
        {
          this.birdSpeed = 0
          this.birdPosition = this.birdPositionOriginal.times(Mat4.translation([0, 9.9, 0]))
          this.playSound('bounce', 0.2)
        }

        else
          { this.endGame(); this.playSound('crashWater'); }

        break;
    }
  
  }

  

  /**************************************************************
    Generate a pair of pipes and push them to end of pipe array
  **************************************************************/
  addPipes()
  {
    var pipeHeight = this.getRandInteger(this.minPipeHeight, this.maxPipeHeight);
    var extraHeight = this.getRandInteger(0, 8);  // Adds variability to how close pipes are to one another

    // Bottom pipe
    this.pipes.push([]);
    this.pipes[this.pipes.length - 1].push(this.pipePositionBottom.times(Mat4.scale([1, 1, pipeHeight])));
    this.pipes[this.pipes.length - 1].push(1.0/this.pipeSpeed);                               // Initial pipe's speed is 0
    this.pipes[this.pipes.length - 1].push(this.pipes[this.pipes.length - 1][0][0][3] + 5);   // Pipe's X coordinate
    this.pipes[this.pipes.length - 1].push(pipeHeight);                                       // Initial pipe's height
    this.pipes[this.pipes.length - 1].push('bottom'); 
    this.pipes[this.pipes.length - 1].push(this.pipePositionBottom.times(Mat4.translation([0, 0, -(pipeHeight - 1.0)/2.0])));                                         
    
    // Top pipe
    this.pipes.push([]);
    this.pipes[this.pipes.length - 1].push(this.pipePositionUpper.times(Mat4.scale([1, 1, (this.maxHeight * 2 + extraHeight) - pipeHeight])));
    this.pipes[this.pipes.length - 1].push(1.0/this.pipeSpeed);                               // Initial pipe's speed is 0
    this.pipes[this.pipes.length - 1].push(this.pipes[this.pipes.length - 1][0][0][3] + 5);   // Pipe's X coordinate
    this.pipes[this.pipes.length - 1].push((this.maxHeight * 2 + extraHeight) - pipeHeight);  // Initial pipe's height
    this.pipes[this.pipes.length - 1].push('top');
    this.pipes[this.pipes.length - 1].push(this.pipePositionUpper.times(Mat4.translation([0, 0, ((this.maxHeight * 2 + extraHeight) - pipeHeight - 1.0)/2.0])));
  }


  /**********************************
    Updates the position of the pipes
  **********************************/
  movePipes(mode = 'normal')
  {
    // new reset condition for dynamically sized pipe array
    if (mode=='reset') { 
      this.pipes = [];
      this.distanceTraveled = 0.0;
    }

    // Pipe's speed
    this.distanceTraveled += 1.0;
    if (this.pipes.length < 1) {
       this.addPipes();
    }

    if(Math.abs(this.distanceTraveled % (-60)) < 0.01) {
       this.addPipes();
    }

    // For each pipe..
    var i = 0;
    while(i < this.pipes.length)
    {      

      // Move the pipes
      this.pipes[i][0] = this.pipes[i][0].times(Mat4.translation([this.pipes[i][1], 0, 0]));
      this.pipes[i][2] = this.pipes[i][0][0][3];  // Update pipe's X coordinate
      this.pipes[i][5] = this.pipes[i][5].times(Mat4.translation([this.pipes[i][1], 0, 0]));

      // If the pipe goes out of boundary...
      if ( this.pipes[i][2] < -1 * this.maxWidth - 5)
      {
        this.pipes.splice(i, 1);
      }

      else {
        i += 1;
      }
    }

  }



  /*********************************************
    Checks for collisions between bird and pipes
  *********************************************/
  checkCollision()
  {
    var topPipeHeight;
    var bottomPipeHeight;

    // For each pipe..
    for(var i = 0; i < this.pipes.length; i++)
    { 
      var xCoord = this.pipes[i][2]                  // Get its X coordinate
      var height = Math.round(this.pipes[i][3] / 2)  // Get its height
      var topORbottom = this.pipes[i][4]             // Get its position
       
      if (xCoord > -1 && xCoord < 1)
      {
        if (topORbottom == 'bottom')
          bottomPipeHeight = -(this.maxHeight - height)

        else if (topORbottom == 'top')
          topPipeHeight = this.maxHeight- height
      }
    }

    if (this.birdPositionHeight - 1.0 >= bottomPipeHeight && this.birdPositionHeight + 0.5 <= topPipeHeight )
    { if (this.state == this.states.play) {this.score++; this.playSound('point', 0.3);} }
      
    else if (bottomPipeHeight != undefined && topPipeHeight != undefined)
    { 
      this.playSound('crash', 0.15); 
      this.collisionAnimationTime = 5
      this.endGame() 
    }

  }

  spawnRock()
  {
      let spawnSide = 1
      if (Math.random() > 0.7)
        spawnSide = -1
      let y = this.groundLevel + this.getRandInteger(-2,1)
      let z = this.getRandInteger(-90, -10) * spawnSide
      let rotation = Mat4.rotation(this.getRandInteger(0, 7), [1,0,0])
      let model_transform = Mat4.identity().times(Mat4.translation([0,y,z]))
                                           .times(rotation)
                                           .times(Mat4.translation([this.groundSize, 0, 0]))
                                           .times(Mat4.scale([this.rockSize,this.rockSize,this.rockSize]))   
      this.rocks.push(model_transform)
      if (this.rocks.length == this.maxRocks) this.rocks.shift()  // free rocks
  }

  spawnBoat()
  {
    let spawnSide = 1
      if (Math.random() > 0.7)
        spawnSide = -1
    let y = this.groundLevel + 1
    let z = this.getRandInteger(-90, -10) * spawnSide
    let rotation = Mat4.rotation(-Math.PI / 2, Vec.of(1,0,0))
    let boatModelTransform = Mat4.identity().times(Mat4.translation([0,y,z]))
                                            .times(rotation)
                                            .times(Mat4.translation([-this.groundSize, 0, 0]))
                                            .times(Mat4.scale([this.boatSize,this.boatSize,this.boatSize])) 
    this.boats.push(boatModelTransform)
    if (this.boats.length >= this.maxBoats) this.boats.shift() // free boats
  }

  spawnForest()
  { 
    let count = 50
    this.forests.splice(0, this.forests.length)
    this.sideForests.splice(0, this.forests.length)
    for(var i = 0; i < count; i++)
    {
      let forestModelTransform = Mat4.identity().times(Mat4.translation([-this.backgroundSize/1.5, this.groundLevel/2, -this.groundSize]))
                                                .times(Mat4.scale([this.forestSize, this.forestSize/2.5 ,1]))
                                                .times(Mat4.translation([i+10,0,0]))

      let model = Mat4.identity().times(Mat4.rotation(-Math.PI / 2, Vec.of(0,1,0))).times(Mat4.translation([-this.backgroundSize/2, this.groundLevel/2, -this.groundSize]))
                                                .times(Mat4.scale([this.forestSize, this.forestSize/2.5 ,1]))
                                                .times(Mat4.translation([i,0,0])) 
                                                

      this.forests.push(forestModelTransform)
      this.sideForests.push(model)
    }
  }

  /********
    Display
  ********/
  display( graphics_state )
  { 
    const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
    const FPS = 1 / dt  // Frames per second
    var sunScale = this.interpolateInt(t, this.backgroundSize/50, this.backgroundSize/10)
    var sunLight = this.interpolateInt(t, sunScale * 10000 + 1000000, sunScale * 100000)
    graphics_state.lights = [
                              new Light( Vec.of(0, this.maxHeight - 8, -this.backgroundSize + 1, 1), Color.of( 0.9921, 0.7216, 0.0745, 1 ), sunLight ),
                              new Light( Vec.of(0, this.maxHeight - 8, this.backgroundSize + 1, 1), Color.of( 0.9921, 0.7216, 0.0745, 1 ), sunLight / 2 ) // Sun
                            ];  
    

    // Camera Positions
    if (this.currentCamera == this.cameraPositions.dynamic)
    {
      var dynamicX = this.interpolateInt(t, this.initialDynamicPosition[0], this.finalDynamicPosition[0])
      var dynamicY = this.interpolateInt(t, this.initialDynamicPosition[1], this.finalDynamicPosition[1])
      var dynamicZ = this.interpolateInt(t, this.initialDynamicPosition[2], this.finalDynamicPosition[2])
      this.dynamic = Mat4.inverse(Mat4.look_at( Vec.of(dynamicX, dynamicY, dynamicZ ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ));
      this.currentCamera = this.cameraPositions["dynamic"] = this.dynamic
    }
    
    const desired_camera = Mat4.inverse(this.currentCamera)
    graphics_state.camera_transform = desired_camera.map( (x,i) => Vec.from( graphics_state.camera_transform[i] ).mix( x, 4*dt ) );
     
    let cameraTextTransform = this.currentCamera.times(Mat4.translation([-this.maxWidth+6,-this.maxHeight+4,-18]))
                                                  .times(Mat4.scale([0.5,0.5,0.5]))
    this.shapes.text.set_string( this.cameraTextString ) 
    this.shapes.text.draw(graphics_state, cameraTextTransform, this.materials.text_image);


    // Draw Sky
    let backWallModelTransform = Mat4.identity().times(Mat4.translation([0,10,-this.backgroundSize]))
                                                .times(Mat4.scale([this.backgroundSize,this.backgroundSize/1.2,1]))

    let rightWallModelTransform = Mat4.identity().times(Mat4.translation([this.backgroundSize,10,0]))
                                                 .times(Mat4.scale([1,this.backgroundSize/1.2,this.backgroundSize]))
                                                 .times(Mat4.rotation(-Math.PI / 2, Vec.of(0,1,0)))


    this.shapes.square.draw(graphics_state, backWallModelTransform, this.materials.background)
    this.shapes.square.draw(graphics_state, rightWallModelTransform, this.materials.background)

    // Draw Forest
    for(var i = 0; i < this.forests.length; i++) 
    {
      let model = this.forests[i].times(Mat4.translation([-this.forestXTranslation + i,0,0]))
      this.shapes.square.draw(graphics_state, model, this.materials.forest)
    }

    let forestSpeed = 0.05/this.forestSize
    let maxForestTranslation = this.forestSize
    this.forestXTranslation += forestSpeed
    if (this.forestXTranslation >= maxForestTranslation) { this.forestXTranslation = forestSpeed }
   
    

    // Draw Ground
    let groundModelTransform = Mat4.identity().times(Mat4.translation([0,this.groundLevel,0]))
                                              .times(Mat4.scale([this.groundSize,1,this.groundSize]))
                                              .times(Mat4.rotation(Math.PI / 2, Vec.of(1,0,0)))

    this.shapes.square.draw(graphics_state, groundModelTransform, this.materials.bumped_ocean)
    this.shapes.square.draw(graphics_state, groundModelTransform.times(Mat4.translation([2,0,0])), this.materials.bumped_ocean)
    this.shapes.square.draw(graphics_state, groundModelTransform.times(Mat4.translation([4,0,0])), this.materials.bumped_ocean)
    
    // Draw Text 
    let messageModelTransform = this.currentCamera.times(Mat4.translation([-7,3,-15]))

    switch (this.currentCamera)
    {
      case this.cameraPositions.dynamic:
      case this.cameraPositions.behind:
        messageModelTransform = this.currentCamera.times(Mat4.translation([this.maxWidth-17,-this.maxHeight+6,-18]))
                                                  .times(Mat4.scale([0.75,0.75,0.75]))
        break
    }

    switch (this.state) 
    {
      case this.states.startScreen:
        this.shapes.text.set_string( "Flappy Duck" )
        this.shapes.text.draw(graphics_state, messageModelTransform, this.materials.text_image)
        break
      case this.states.gameOver:
        this.shapes.text.set_string( "Game Over!" )
        this.shapes.text.draw(graphics_state, messageModelTransform, this.materials.text_image)
        break
    }


    // Score
    let scoreModelTransfrom = this.currentCamera.times(Mat4.translation([-this.maxWidth+6,this.maxHeight-4,-18]))
                                                  .times(Mat4.scale([0.5,0.5,0.5]))
    // Dynamic Scoreboard
    switch (this.currentCamera)
    {
      case this.cameraPositions.dynamic:
      case this.cameraPositions.behind:
        scoreModelTransfrom = this.currentCamera.times(Mat4.translation([this.maxWidth-12,-this.maxHeight+4,-18]))
                                                  .times(Mat4.scale([0.5,0.5,0.5]))
    }

    this.shapes.text.set_string( "Score: " + this.score.toString() ) 
    this.shapes.text.draw(graphics_state, scoreModelTransfrom, this.materials.text_image);
    

    // Contains elements to load just once such as music
    if (this.onLoad)
    {
      this.playSound('BG', 0.2, 'play');
      this.sounds['BG'].loop = true;
      this.playSound('oceanAmbient', 0.2, 'play');
      this.sounds['oceanAmbient'].loop = true;
      this.onLoad = false
    }


    // Move and Draw Bird
    this.birdPositionHeight = this.birdPosition[1][3] // Bird's Height
    switch (this.state)
    {
      case this.states.gameOver:
        if (this.collisionAnimationTime > 0) this.shapes.square.draw(graphics_state, this.birdPosition.times(Mat4.translation([-2,0,0])).times(Mat4.scale([2,2,2])).times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0))), this.materials.collision)
        this.collisionAnimationTime--
        break

      default:
        if (this.state == this.states.play) this.moveBird('gravity')
        this.shapes.bird.draw(graphics_state, this.birdPosition, this.materials.bird)
        break
    }
    

    // Move and Draw Pipes
    if (this.state != this.states.startScreen) this.movePipes()
    for(var i = 0; i < this.pipes.length; i++) {
      this.shapes.mainPipe.draw(graphics_state, this.pipes[i][0], this.materials.pipe)
      this.shapes.pipeTip.draw(graphics_state, this.pipes[i][5], this.materials.pipe)
    }


    // Spawn new rock
    if (this.rocks.length < this.maxRocks && this.getRandInteger(0,this.rockSpawnFrequency) == 10) this.spawnRock()

    // Draw Rocks
    for(var rock = 0; rock < this.rocks.length; rock++)
    {
      this.shapes.rock.draw(graphics_state, this.rocks[rock], this.materials.rock)
      this.rocks[rock] = this.rocks[rock].times(Mat4.translation([-0.2/this.rockSize,0,0]))
    }


    // Spawn new Boat
    if (this.boats.length < this.maxBoats && this.getRandInteger(0,this.boatSpawnFrequency) == 10) this.spawnBoat()

    // Draw Boats
    for(var boat = 0; boat < this.boats.length; boat++)
    {
      this.shapes.boat.draw(graphics_state, this.boats[boat], this.materials.boat)
      this.boats[boat] = this.boats[boat].times(Mat4.translation([0.2/this.boatSize,0,0]))
    }


    // Draw Sun
    let sunTransform = Mat4.identity().times(Mat4.translation([0, this.backgroundSize/2.5, -this.backgroundSize + 1]))
                                                .times(Mat4.scale([sunScale, sunScale, sunScale]))
    this.shapes.square.draw(graphics_state, sunTransform, this.materials.sun)


    // Draw Boundaries - DELETE
    if (this.showBoundaries)
    {
      this.shapes.axis.draw( graphics_state, Mat4.identity(), this.materials.phong.override( {color: this.basicColors('cyan', 0.5) }) );

      this.shapes.cube.draw( graphics_state, Mat4.identity().times(Mat4.translation([0, this.maxHeight, 0])).times(Mat4.rotation(Math.PI/2, [1, 0, 0])).times(Mat4.scale([1, 1, 0.1])),
                                                               this.materials.phong.override( {color: this.basicColors('red', 0.5) }) );

      this.shapes.cube.draw( graphics_state, Mat4.identity().times(Mat4.translation([0, -1 * this.maxHeight, 0])).times(Mat4.rotation(Math.PI/2, [1, 0, 0])).times(Mat4.scale([1, 1, 0.1])),
                                                               this.materials.phong.override( {color: this.basicColors('red', 0.5) }) );

      this.shapes.cube.draw( graphics_state, Mat4.identity().times(Mat4.translation([this.maxWidth, 0, 0])).times(Mat4.rotation(Math.PI/2, [0, 1, 0])).times(Mat4.scale([1, 1, 0.1])),
                                                               this.materials.phong.override( {color: this.basicColors('red', 0.5) }) );

      this.shapes.cube.draw( graphics_state, Mat4.identity().times(Mat4.translation([-1 * this.maxWidth, 0, 0])).times(Mat4.rotation(Math.PI/2, [0, 1, 0])).times(Mat4.scale([1, 1, 0.1])),
                                                               this.materials.phong.override( {color: this.basicColors('red', 0.5) }) );
    }

    // Check for collisions
    if (this.state == this.states.play) this.checkCollision()

  }


  
  /*****************
    Helper Functions
  *****************/

  // Returns a random number between min and max (both included)
  getRandInteger(min, max) 
  { return Math.floor(Math.random() * (max - min + 1) ) + min; }


  /* Interpolates between two values
     Interval - Changes the duration between initial and final
     Strength - Affects the difference between final and initial. High number will result in the average between the two.
     verticalOffset - Increases initial and final by the same amount */
  interpolateInt(time, initial, final, interval = 5, strength = 2, verticalOffset = 0.5)
  {
    var interpolationFunction = -(Math.cos(Math.PI * time / interval)) / strength + verticalOffset;
    return initial + interpolationFunction * (final - initial)
  }
  

  // Plays the specified sound
  playSound(name, volume = 1, mode = 'play')
  { 
    switch(mode)
    {
      case 'play':
        this.sounds[ name ].currentTime = 0;
        this.sounds[ name ].volume = Math.min(Math.max(volume, 0), 1);
        var promise = this.sounds[ name ].play();
        break;

      case 'pause':
        this.sounds[ name ].pause()
        break;

      case 'mute':
        if (this.sounds[name].muted == undefined)
          this.sounds[name].muted = true
        else
          this.sounds[name].muted = !this.sounds[name].muted    
        break;
    }
  }
}




// Sky Scrolling Background
class Texture_Scroll_X extends Phong_Shader
{ fragment_glsl_code()           // ********* FRAGMENT SHADER ********* 
    {
      // TODO:  Modify the shader below (right now it's just the same fragment shader as Phong_Shader) for requirement #6.
      return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.di
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          vec2 mVector = f_tex_coord; 
          mat4 mMatrix = mat4(vec4(1., 0., 0., 0.), vec4(0., 1., 0., 0.), vec4( 0., 0., 1., 0.), vec4( mod(0.4 * animation_time, 88.) , 0., 0., 1.)); 
          vec4 tempVector = vec4(mVector, 0, 0); 
          tempVector = tempVector + vec4(1., 1., 0., 1.); 
          tempVector = mMatrix * tempVector; 

          vec4 tex_color = texture2D( texture, tempVector.xy );                         // Sample the texture image in the correct place.
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
    }
}

class Scroll_X extends Phong_Shader
{ fragment_glsl_code()           // ********* FRAGMENT SHADER ********* 
    {
      return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          
          float vx = 0.05 * animation_time;  // !!!This changes the speed!!!

          mat4 translation = mat4(1.0,0.0,0.0,0.0,    //column 1
                                  0.0,1.0,0.0,0.0,    //column 2
                                  0.0,0.0,1.0,0.0,    //column 3
                                   vx,0.0,0.0,1.0 );  //column 4
          vec4 coord = translation * vec4(f_tex_coord,0.0,1.0);
          vec2 coordinates;  
        
//           if (animation_time > 100.0 )      // After time limit, reset coordinates for better precision
//           {    
//             coordinates = vec2(mod(coord[0],1.000001),coord[1]);
//           } 
//           else 
//           {
//               coordinates = coord.xy;
//           }

          coordinates = coord.xy;

          vec4 tex_color = texture2D( texture, coordinates );                         // Sample the texture image in the correct place.
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
    }
}



class Scroll_X_Bump extends Bump_Shader
{ fragment_glsl_code()           // ********* FRAGMENT SHADER ********* 
    {
      return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          float vx = 0.05 * animation_time;  // !!!This changes the speed!!!

          mat4 translation = mat4(1.0,0.0,0.0,0.0,    //column 1
                                  0.0,1.0,0.0,0.0,    //column 2
                                  0.0,0.0,1.0,0.0,    //column 3
                                   vx,0.0,0.0,1.0 );  //column 4
          vec4 coord = translation * vec4(f_tex_coord,0.0,1.0);
          vec2 coordinates;  
          coordinates = coord.xy;

          vec4 tex_color = texture2D( texture, coordinates );                         // Sample the texture image in the correct place.
                                                                                      // Compute an initial (ambient) color:
          vec3 newN = normalize(texture2D( texture2, coordinates ).xyz - 0.5 * vec3(1, 1, 1));                                                             
          gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz) * ambient, shapeColor.w * tex_color.w );
          gl_FragColor.xyz = 0.4 * gl_FragColor.xyz + phong_model_lights( newN.xyz, gl_FragColor );                     // Compute the final color with contributions from lights.
        }`;
    }
}