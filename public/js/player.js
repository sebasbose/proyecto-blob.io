// player.js - Player class and related functionality
class Player {
  constructor(name, x, y, radius, isLocal = false) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.isLocal = isLocal;
    this.isAI = false;
    
    // Movement
    this.targetX = x;
    this.targetY = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.maxSpeed = 3;
    this.acceleration = 0.2;
    this.friction = 0.9;
    
    // Game stats
    this.score = Math.floor(radius * radius / 10);
    this.mass = radius * radius;
    
    // Visual properties
    this.color = this.generateColor();
    this.strokeColor = this.lightenColor(this.color, 20);
    this.glowIntensity = 0;
    
    // Animation
    this.pulseAnimation = 0;
    this.nameOffset = 0;
    
    // Trail effect
    this.trail = [];
    this.maxTrailLength = 10;
  }

  generateColor() {
    // Generate a vibrant color based on name hash
    let hash = 0;
    for (let i = 0; i < this.name.length; i++) {
      hash = this.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert hash to HSL color
    const hue = Math.abs(hash) % 360;
    const saturation = 70 + (Math.abs(hash) % 30); // 70-100%
    const lightness = 45 + (Math.abs(hash) % 20);  // 45-65%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  lightenColor(color, percent) {
    // Simple color lightening for stroke effect
    if (color.startsWith('hsl')) {
      const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (match) {
        const [, h, s, l] = match;
        const newL = Math.min(100, parseInt(l) + percent);
        return `hsl(${h}, ${s}%, ${newL}%)`;
      }
    }
    return color;
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  update(deltaTime) {
    this.updateMovement(deltaTime);
    this.updateAnimations(deltaTime);
    this.updateTrail();
    this.updateSpeed();
  }

  updateMovement(deltaTime) {
    // Calculate direction to target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) { // Only move if not at target
      // Normalize direction
      const dirX = dx / distance;
      const dirY = dy / distance;
      
      // Apply acceleration towards target
      this.velocityX += dirX * this.acceleration * deltaTime * 60;
      this.velocityY += dirY * this.acceleration * deltaTime * 60;
    }
    
    // Apply friction
    this.velocityX *= this.friction;
    this.velocityY *= this.friction;
    
    // Limit speed based on size (larger = slower)
    const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
    const maxSpeedForSize = this.maxSpeed * (20 / this.radius);
    
    if (currentSpeed > maxSpeedForSize) {
      this.velocityX = (this.velocityX / currentSpeed) * maxSpeedForSize;
      this.velocityY = (this.velocityY / currentSpeed) * maxSpeedForSize;
    }
    
    // Update position
    this.x += this.velocityX * deltaTime * 60;
    this.y += this.velocityY * deltaTime * 60;
  }

  updateAnimations(deltaTime) {
    // Pulse animation
    this.pulseAnimation += deltaTime * 2;
    
    // Name offset animation
    this.nameOffset = Math.sin(this.pulseAnimation) * 2;
    
    // Glow intensity based on movement
    const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
    this.glowIntensity = Math.min(15, speed * 3);
  }

  updateTrail() {
    // Add current position to trail
    this.trail.unshift({ x: this.x, y: this.y, radius: this.radius });
    
    // Limit trail length
    if (this.trail.length > this.maxTrailLength) {
      this.trail.pop();
    }
  }

  updateSpeed() {
    // Recalculate max speed based on current size
    this.maxSpeed = 3 * (20 / this.radius);
    this.mass = this.radius * this.radius;
  }

  eat(value) {
    // Increase score and size
    this.score += value;
    
    // Calculate new radius based on score
    const newRadius = Math.sqrt(this.score * 10);
    this.radius = newRadius;
    
    // Add eating effect
    this.pulseAnimation = 0;
    this.glowIntensity = 20;
    
    // Update speed for new size
    this.updateSpeed();
  }

  draw(ctx, screenX, screenY) {
    // Draw trail effect
    this.drawTrail(ctx, screenX, screenY);
    
    // Draw glow effect
    if (this.glowIntensity > 0) {
      this.drawGlow(ctx, screenX, screenY);
    }
    
    // Draw main body
    this.drawBody(ctx, screenX, screenY);
    
    // Draw name
    this.drawName(ctx, screenX, screenY);
    
    // Draw special effects for local player
    if (this.isLocal) {
      this.drawLocalPlayerEffects(ctx, screenX, screenY);
    }
  }

  drawTrail(ctx, screenX, screenY) {
    if (this.trail.length < 2) return;
    
    ctx.globalAlpha = 0.3;
    
    for (let i = 1; i < this.trail.length; i++) {
      const trailPoint = this.trail[i];
      const alpha = (1 - i / this.trail.length) * 0.3;
      const radius = trailPoint.radius * (1 - i / this.trail.length * 0.5);
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(
        screenX - (this.x - trailPoint.x),
        screenY - (this.y - trailPoint.y),
        radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  }

  drawGlow(ctx, screenX, screenY) {
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.glowIntensity;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawBody(ctx, screenX, screenY) {
    // Main body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Body outline
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = Math.max(2, this.radius / 10);
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner highlight
    const highlightRadius = this.radius * 0.7;
    const gradient = ctx.createRadialGradient(
      screenX - this.radius * 0.3, screenY - this.radius * 0.3, 0,
      screenX, screenY, highlightRadius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, highlightRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Pulse effect
    if (this.pulseAnimation < Math.PI) {
      const pulseRadius = this.radius + Math.sin(this.pulseAnimation) * 5;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5 * (1 - this.pulseAnimation / Math.PI);
      ctx.beginPath();
      ctx.arc(screenX, screenY, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  drawName(ctx, screenX, screenY) {
    // Calculate font size based on player size
    const fontSize = Math.max(12, Math.min(24, this.radius / 2));
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw name with outline
    const nameY = screenY + this.nameOffset;
    ctx.strokeText(this.name, screenX, nameY);
    ctx.fillText(this.name, screenX, nameY);
    
    // Draw score below name
    if (this.radius > 25) {
      ctx.font = `${fontSize * 0.8}px Arial`;
      ctx.fillStyle = '#cccccc';
      ctx.fillText(this.score.toString(), screenX, nameY + fontSize);
    }
  }

  drawLocalPlayerEffects(ctx, screenX, screenY) {
    // Draw targeting line to mouse (if moving)
    const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
    if (speed > 0.5) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > this.radius) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        
        // Calculate screen position of target
        const targetScreenX = this.targetX - (this.x - screenX);
        const targetScreenY = this.targetY - (this.y - screenY);
        
        ctx.lineTo(targetScreenX, targetScreenY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    
    // Draw special border for local player
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Utility methods
  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  canEat(other) {
    return this.radius > other.radius * 1.1;
  }

  getStats() {
    return {
      name: this.name,
      score: this.score,
      radius: this.radius,
      position: { x: this.x, y: this.y },
      isLocal: this.isLocal
    };
  }

  // Split functionality (for future expansion)
  split() {
    if (this.radius < 30) return null;
    
    // Create smaller version
    const newRadius = this.radius * 0.7;
    const newPlayer = new Player(
      this.name + '_split',
      this.x,
      this.y,
      newRadius,
      false
    );
    
    // Update current player
    this.radius = newRadius;
    this.score = Math.floor(newRadius * newRadius / 10);
    
    return newPlayer;
  }

  // Eject mass functionality (for future expansion)
  ejectMass() {
    if (this.radius < 25) return null;
    
    // Create food pellet
    const ejectSize = 5;
    const ejectDistance = this.radius + 20;
    
    // Calculate ejection position
    const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
    const ejectX = this.x + Math.cos(angle) * ejectDistance;
    const ejectY = this.y + Math.sin(angle) * ejectDistance;
    
    // Reduce player size slightly
    this.radius *= 0.95;
    this.score = Math.floor(this.radius * this.radius / 10);
    
    return {
      x: ejectX,
      y: ejectY,
      radius: ejectSize,
      color: this.color,
      value: 5
    };
  }
}