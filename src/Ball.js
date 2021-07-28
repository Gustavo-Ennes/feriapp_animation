import * as THREE from 'https://cdn.skypack.dev/three@0.130.0';

export default class Ball{

  static balls = []
  static BONDARIES = {
    x: {min: -125, max: 125},
    y: {min: -125, max: 125},
    z: {min: -124, max: 124}
  }
  static MAX_BALLS = 30

  constructor(scene){
    let g,m;

    this.radius = 1 + Math.random() * 2

    g = new THREE.SphereGeometry(this.radius, 55, 55);
    m = new THREE.MeshPhongMaterial({color: new THREE.Color(0xd39e00)})
    this.mesh = new THREE.Mesh(g, m)
    this.mesh.position.copy(Ball.randomPos())
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true

    scene.add(this.mesh)
    Ball.balls.push(this)

    this.velocity = {
      x: .7 + Math.random() * 1.5,
      y: .7 + Math.random() * 1.5,
      z: .7 + Math.random() * 1.5,
    }

    if(Math.random() * 2 < 1){this.velocity.x *= -1}
    if(Math.random() * 2 < 1){this.velocity.y *= -1}
    if(Math.random() * 2 < 1){this.velocity.z *= -1}

    this.scale = 1
    this.scene = scene
    this.pregDuration = 1 + Math.random() * 3
    this.pregCounter = 0
    this.velocityDecay = (this.velocity.x + this.velocity.y + this.velocity.z) / 3 / 1000
    this.canVerifyCollision = true
  }

  dispose(){
    this.isDead = true
    this.scene.remove(this.mesh)
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
  }

  explodeRoutine(){
   let tween = new TWEEN.Tween(this.mesh.scale)
   .to({x: "+10", y: "+10", z: "+10"}, 200)
   .easing(TWEEN.Easing.Quadratic.InOut)
   .onComplete(()=>{
     TWEEN.remove(tween)
     this.dispose()
    })
   .start()
  }
  
  movimentRoutine(){
    this.mesh.position.x += this.velocity.x
    this.mesh.position.y += this.velocity.y
    this.mesh.position.z += this.velocity.z
  }

  boundingSphereRoutine(){
    this.mesh.geometry.boundingSphere = new THREE.Sphere(this.mesh.position, this.getRadius())
  }



  updateRoutine(cube){
    this.updateCollision(cube)
    this.movimentRoutine()
    this.bornRoutine()
  }

  invertAxis(letter){
    this.mesh.material.color.copy(Ball.randomColor())
    const tween = new TWEEN.Tween(this.mesh.scale)
    switch(letter){
      case 'x':
        this.velocity.x *= -1
        tween.to({x: [.1, 1], y: [1.7, 1], z:[1.7, 1]}, 300)
      break;
      case 'y':
        this.velocity.y *= -1
        tween.to({y: [.1, 1] , x: [1.7, 1], z:[1.7, 1]}, 300)
      break;
      case 'z':
        this.velocity.z *= -1
        tween.to({z: [.1, 1], y: [1.7, 1], x:[1.7, 1]}, 300)
      break;
      case 'all':
        this.velocity.x *= -1
        this.velocity.y *= -1
        this.velocity.z *= -1
      break;
    }
    tween.easing(TWEEN.Easing.Quadratic.In)
    tween.start()
  }

  getRadius(){
    return this.scale * this.radius
  }

  increaseRadius(){
    this.scale += 1 + Math.random() * .05
    const newScale = new THREE.Vector3(this.scale, this.scale, this.scale)
    console.log(`increasing radius: scale===${this.scale}`)
    let t = new TWEEN.Tween(this.mesh.scale)
    .to(newScale, 200)
    .easing(TWEEN.Easing.Cubic.InOut)
    .onStart(()=>{
      this.pregCounter++      
    })
    .onComplete(()=>{TWEEN.remove(t)})
    .start()

  }

  updateCollision(cube){
    if(this.canVerifyCollision){
      this.canVerifyCollision = false
      if((this.mesh.position.x + this.getRadius()) >= Ball.BONDARIES.x.max || (this.mesh.position.x - this.getRadius()) <= Ball.BONDARIES.x.min){
        this.invertAxis('x')
      }
      if((this.mesh.position.y + this.getRadius()) >= Ball.BONDARIES.y.max || (this.mesh.position.y - this.getRadius()) <= Ball.BONDARIES.y.min){
        this.invertAxis('y')
      }
      if((this.mesh.position.z + this.getRadius()) >= Ball.BONDARIES.z.max || (this.mesh.position.z - this.getRadius()) <= Ball.BONDARIES.z.min){
        this.invertAxis('z')
      }
      setTimeout(()=>{
        this.canVerifyCollision = true
      }, 50)
    }
  }


  bornRoutine(){
    if(this.pregCounter >= this.pregDuration && Ball.balls.length < Ball.MAX_BALLS){
      this.pregCounter = 0

      this.scale = 1
      const newScale = new THREE.Vector3(1, 1, 1)
      const t = new TWEEN.Tween(this.mesh.scale)
      .to(newScale, 200)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onComplete(()=>{
        TWEEN.remove(t)
        new Ball(this.scene)
        this.explodeRoutine()
      })
      .start()

    }
  }

  static update(cube){
    Ball.balls.forEach(ball => {
      ball.mesh.geometry.computeBoundingSphere()
      ball.updateRoutine(cube)
    })
  }

  // I'm modifying the array inside the array
  // so i'll create and set attribute to modify the array after the loop
  static ballCollisions(){
    let distance
    for(let i = 0; i < Ball.balls.length - 1; i++){
      for(let j = i + 1; j < Ball.balls.length; j++){
        distance = Ball.balls[i].mesh.geometry.boundingSphere.distanceToPoint(Ball.balls[j].mesh.position)
        if(distance > 0 && distance < (Ball.balls[i].getRadius() + Ball.balls[j].getRadius()) ){
          Ball.balls[i].explodeRoutine()
          Ball.balls[j].increaseRadius()
        }
      }
    }
  }

  static randomPos(){
    return new THREE.Vector3(
      Math.random() * (Ball.BONDARIES.x.max - 3) + (Ball.BONDARIES.x.min + 3),
      Math.random() * (Ball.BONDARIES.y.max - 3) + (Ball.BONDARIES.y.min + 3),
      Math.random() * (Ball.BONDARIES.z.max - 3) + (Ball.BONDARIES.z.min + 3)
    )
  }

  static randomColor(){
    return new THREE.Color(
      .5 + Math.random() * .4,
      .5 + Math.random() * .4,
      .5 + Math.random() * .4
    )
  }

};