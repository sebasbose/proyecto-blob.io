// food.js - Food generation and management
class FoodManager {
  constructor(game) {
    this.game = game;
    this.food = [];
    this.spawnRate = 2; // foods per second
    this.lastSpawnTime = 0;
    
    // Food types
    this.foodTypes = {
      small: {
        radius: { min: 2, max: 4 },
        value: 1,
        weight: 70, // Spawn probability weight
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffa726']
      },
      medium: {
        radius: { min: 4, max: 7 },
        value: 3,
        weight: 25,
        colors: ['#ab47bc', '#ef5350', '#66bb6a', '#42a5f5', '#ff7043']
      },
      large: {
        radius: { min: 7, max: 10 },
        value: 5,
        weight: 5,
        colors: ['#ec407a', '#26c6da', '#ff5722', '#9c27b0', '#3f51b5']
      }
    };
  }

  update(deltaTime) {
    this.spawnFood(deltaTime);
    this.updateFood(deltaTime);
    this.cleanupFood();
  }

  spawnFood(deltaTime) {
    this.lastSpawnTime += deltaTime;
    
    if (this.lastSpawnTime >= 1 / this.spawnRate) {
      this.createRandomFood();
      this.lastSpawnTime = 0;
    }
  }

  createRandomFood() {
    // Determine food type based on weights
    const totalWeight = Object.values(this.foodTypes).reduce((sum, type) => sum + type.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedType = null;
    for (const [typeName, type] of Object.entries(this.foodTypes)) {
      random -= type.weight;
      if (random <= 0) {
        selectedType = { name: typeName, ...type };
        break;
      }
    }
    
    if (!selectedType) {
      selectedType = { name: 'small', ...this.foodTypes.small };
    }
    
    // Create food with selected type
    const food = this.createFood(selectedType);
    this.food.push(food);
  }

  createFood(type) {
    const radius = Math.random() * (type.radius.max - type.radius.min) + type.radius.min;
    const color = type.colors[Math.floor(Math.random() * type.colors.length)];
    
    return {
      x: Math.random() * this.game.worldSize.width,
      y: Math.random() * this.game.worldSize.height,
      radius: radius,
      color: color,
      value: type.value,
      type: type.name,
      age: 0,
      maxAge: 60, // seconds before despawn
      pulsePhase: Math.random() * Math.PI * 2,
      glowIntensity: 0,
      
      // Animation properties
      floatOffset: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 2,
      rotation: 0,
      
      // Special effects
      sparkles: [],
      
      // Physics (for special food types)
      velocityX: 0,
      velocityY: 0,
      friction: 0.98
    };
  }

  updateFood(deltaTime) {
    this.food.forEach(food => {
      food.age += deltaTime;
      
      // Update animations
      food.pulsePhase += deltaTime * 2;
      food.rotation += food.rotationSpeed * deltaTime;
      food.floatOffset += deltaTime;
      
      // Glow effect based on value
      food.glowIntensity = 5 + food.value * 2 + Math.sin(food.pulsePhase) * 3;
      
      // Update sparkles for large food
      if (food.type === 'large') {
        this.updateSparkles(food, deltaTime);
      }
      
      // Physics for moving food (future feature)
      if (food.velocityX !== 0 || food.velocityY !== 0) {
        food.x += food.velocityX * deltaTime * 60;
        food.y += food.velocityY * deltaTime * 60;
        food.velocityX *= food.friction;
        food.velocityY *= food.friction;
      }
    });
  }

  updateSparkles(food, deltaTime) {
    // Add new sparkles
    if (Math.random() < 0.3) {
      food.sparkles.push({
        x: (Math.random() - 0.5) * food.radius * 2,
        y: (Math.random() - 0.5) * food.radius * 2,
        life: 1,
        maxLife: 1,
        size: Math.random() * 2 + 1
      });
    }
    
    // Update existing sparkles
    food.sparkles.forEach(sparkle => {
      sparkle.life -= deltaTime * 2;
    });
    
    // Remove dead sparkles
    food.sparkles = food.sparkles.filter(sparkle => sparkle.life > 0);
  }

  cleanupFood() {
    // Remove old food
    this.food = this.food.filter(food => food.age < food.maxAge);
  }

  draw(ctx, camera) {
    this.food.forEach(food => {
      const screenX = food.x - camera.x;
      const screenY = food.y - camera.y;
      
      // Only draw if on screen
      if (this.isOnScreen(screenX, screenY, food.radius, ctx.canvas)) {
        this.drawFood(ctx, food, screenX, screenY);
      }
    });
  }

  drawFood(ctx, food, screenX, screenY) {
    ctx.save();
    
    // Translate to food position
    ctx.translate(screenX, screenY);
    ctx.rotate(food.rotation);
    
    // Draw glow effect
    if (food.glowIntensity > 0) {
      ctx.shadowColor = food.color;
      ctx.shadowBlur = food.glowIntensity;
    }
    
    // Draw main food body
    this.drawFoodBody(ctx, food);
    
    // Draw sparkles for large food
    if (food.type === 'large') {
      this.drawSparkles(ctx, food);
    }
    
    // Draw special patterns based on type
    this.drawFoodPattern(ctx, food);
    
    ctx.restore();
  }

  drawFoodBody(ctx, food) {
    // Pulsing effect
    const pulseScale = 1 + Math.sin(food.pulsePhase) * 0.1;
    const currentRadius = food.radius * pulseScale;
    
    // Main body
    ctx.fillStyle = food.color;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner highlight
    const gradient = ctx.createRadialGradient(
      -currentRadius * 0.3, -currentRadius * 0.3, 0,
      0, 0, currentRadius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Outer glow ring
    ctx.strokeStyle = food.color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  drawFoodPattern(ctx, food) {
    ctx.shadowBlur = 0;
    
    switch (food.type) {
      case 'small':
        // Simple dot pattern
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, food.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'medium':
        // Cross pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-food.radius * 0.5, 0);
        ctx.lineTo(food.radius * 0.5, 0);
        ctx.moveTo(0, -food.radius * 0.5);
        ctx.lineTo(0, food.radius * 0.5);
        ctx.stroke();
        break;
        
      case 'large':
        // Star pattern
        this.drawStar(ctx, 0, 0, 5, food.radius * 0.4, food.radius * 0.2);
        break;
    }
  }

  drawStar(ctx, centerX, centerY, points, outerRadius, innerRadius) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    
    const angle = Math.PI / points;
    
    for (let i = 0; i < 2 * points; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + Math.cos(i * angle) * radius;
      const y = centerY + Math.sin(i * angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.fill();
  }

  drawSparkles(ctx, food) {
    food.sparkles.forEach(sparkle => {
      const alpha = sparkle.life / sparkle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sparkle.x, sparkle.y, sparkle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  isOnScreen(x, y, radius, canvas) {
    return x + radius > 0 && x - radius < canvas.width &&
           y + radius > 0 && y - radius < canvas.height;
  }

  // Collision detection
  checkCollisions(players) {
    const collisions = [];
    
    for (let i = this.food.length - 1; i >= 0; i--) {
      const food = this.food[i];
      
      for (const [playerId, player] of players) {
        const distance = Math.sqrt(
          (food.x - player.x) ** 2 + (food.y - player.y) ** 2
        );
        
        if (distance < food.radius + player.radius) {
          collisions.push({
            playerId: playerId,
            player: player,
            food: food,
            index: i
          });
          break; // Food can only be eaten by one player
        }
      }
    }
    
    return collisions;
  }

  removeFood(index) {
    if (index >= 0 && index < this.food.length) {
      this.food.splice(index, 1);
    }
  }

  // Special food creation methods
  createBonusFood(x, y) {
    const bonusFood = {
      x: x,
      y: y,
      radius: 15,
      color: '#gold',
      value: 20,
      type: 'bonus',
      age: 0,
      maxAge: 10, // Disappears faster
      pulsePhase: 0,
      glowIntensity: 20,
      floatOffset: 0,
      rotationSpeed: 3,
      rotation: 0,
      sparkles: [],
      velocityX: 0,
      velocityY: 0,
      friction: 0.98
    };
    
    this.food.push(bonusFood);
    return bonusFood;
  }

  createVirusFood(x, y) {
    // Virus-like food that can split large players
    const virus = {
      x: x,
      y: y,
      radius: 20,
      color: '#8B4513',
      value: -10, // Negative value - harmful
      type: 'virus',
      age: 0,
      maxAge: 120, // Lasts longer
      pulsePhase: 0,
      glowIntensity: 10,
      floatOffset: 0,
      rotationSpeed: 1,
      rotation: 0,
      sparkles: [],
      velocityX: 0,
      velocityY: 0,
      friction: 0.98,
      spikes: 8 // Visual spikes
    };
    
    this.food.push(virus);
    return virus;
  }

  // Maintenance methods
  getFoodCount() {
    return this.food.length;
  }

  getFoodInArea(x, y, radius) {
    return this.food.filter(food => {
      const distance = Math.sqrt((food.x - x) ** 2 + (food.y - y) ** 2);
      return distance <= radius;
    });
  }

  clearAllFood() {
    this.food = [];
  }

  // Statistics
  getFoodStats() {
    const stats = {
      total: this.food.length,
      byType: {}
    };
    
    Object.keys(this.foodTypes).forEach(type => {
      stats.byType[type] = this.food.filter(food => food.type === type).length;
    });
    
    return stats;
  }
}