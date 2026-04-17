# Design System Strategy: The Synthetic Compass

## 1. Overview & Creative North Star
This design system is built to transform indoor navigation from a utility into a sensory, high-fidelity experience. Our Creative North Star is **"The Synthetic Compass."** 

We are moving away from the "flat" utility of standard mapping apps and toward a futuristic, AR-inspired HUD (Heads-Up Display). The aesthetic is rooted in high-contrast depths—where the UI doesn't just sit on top of a screen but feels like it is projected into the environment. By utilizing deep blacks, neon accents, and intentional asymmetry, we create a sense of focused intelligence. We break the "template" look by avoiding rigid grids in favor of floating, layered elements and a typography scale that favors dramatic contrast.

---

## 2. Colors & Tonal Logic
The palette is engineered for low-light environments and high-focus navigation.

*   **The Foundation:** Use `background` (#0e0e0e) as the base canvas. It is a deep, "true" black that allows the accents to pop with luminous energy.
*   **The Accents:** 
    *   `primary` (#8ff5ff): The "Pathfinder." Used for active routes, direction arrows, and primary progress.
    *   `secondary` (#2ff801): The "Arrival." Reserved for destination points, successful scans, and "Go" states.
    *   `tertiary` (#65afff): The "Information." Used for secondary data like POIs (Points of Interest) or floor levels.

### The "No-Line" Rule
**Standard 1px solid borders are strictly prohibited.** To define boundaries between sections, you must use background color shifts. For example, a card should be `surface-container-high` (#201f1f) sitting on a `surface` (#0e0e0e) background. Let the change in value define the edge, not a line.

### The "Glass & Gradient" Rule
Floating navigation overlays must utilize glassmorphism. Use `surface-container` tiers with a 70-80% opacity and a high `backdrop-blur` (20px-40px). For primary CTAs, apply a subtle linear gradient from `primary` (#8ff5ff) to `primary-container` (#00eefc) at a 135-degree angle to give the button a "glowing" volumetric feel.

---

## 3. Typography
We utilize a dual-font system to balance technical precision with extreme legibility.

*   **The Voice (Display & Headlines):** Use **Space Grotesk**. Its geometric quirks and technical feel reinforce the futuristic "Synthetic Compass" vibe. Use `display-lg` for massive, asymmetric floor numbers or status arrivals to create an editorial, high-end look.
*   **The Content (Title & Body):** Use **Inter**. It is the workhorse for high-speed reading. 
*   **Hierarchy Strategy:** Maintain high contrast between labels and headlines. A `label-sm` in `on-surface-variant` (#adaaaa) should often sit near a `headline-md` in `on-surface` (#ffffff) to create an authoritative, data-dense layout that feels professional and curated.

---

## 4. Elevation & Depth: Tonal Layering
In this design system, depth is biological, not mechanical. We avoid harsh drop shadows.

*   **Layering Principle:** Stack `surface-container` tiers to create hierarchy. 
    *   *Level 0:* `surface` (#0e0e0e) - The world/map layer.
    *   *Level 1:* `surface-container-low` (#131313) - Large background groupings.
    *   *Level 2:* `surface-container-high` (#201f1f) - Interactive cards and modal sheets.
*   **Ambient Shadows:** If a card must "float" (like a persistent navigation tip), use a shadow with a 32px blur, 0px offset, and 6% opacity using a tint of `primary`. This mimics the glow of an AR projection rather than a physical shadow.
*   **The Ghost Border:** If contrast is insufficient for accessibility, use a "Ghost Border": 1px stroke using `outline-variant` (#494847) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### High-Fidelity Buttons
*   **Primary:** Use `primary` (#8ff5ff) with `on-primary` (#005d63) text. Apply the `xl` (1.5rem) rounding scale. No borders.
*   **Secondary/Ghost:** Use a transparent background with a "Ghost Border" and `primary` colored text.
*   **States:** On press, transition the background to `primary-dim` (#00deec).

### The Navigation Card (The "Hero" Component)
*   **Structure:** Use `surface-container-highest` (#262626) with an `xl` corner radius. 
*   **Content:** Avoid dividers. Use 24px of vertical padding (from the spacing scale) to separate the "Next Turn" instruction from the "Distance Remaining" data.
*   **Visual Cue:** Use a 4px vertical "glow strip" of `secondary` (#2ff801) on the far left edge of the card to indicate an active, healthy navigation state.

### Input Fields & Search
*   **Container:** Use `surface-container-lowest` (#000000) to create a "well" effect, making the input feel recessed into the hardware.
*   **Focus State:** The "Ghost Border" should transition to 50% opacity `primary` (#8ff5ff) with a subtle outer glow.

### Toast Messages
*   **Style:** Minimalist floating pills. Use `surface-bright` (#2c2c2c) with a `full` (9999px) corner radius. 
*   **Icons:** Always pair with a high-vibrancy icon in `error` (#ff716c) or `secondary` (#2ff801) to ensure the status is understood at a glance without reading.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use intentional asymmetry. Place a floor indicator (`display-lg`) off-center to create a modern, editorial feel.
*   **Do** leverage `surface-container` tiers to group related information instead of using lines.
*   **Do** ensure all touch targets are at least 48dp, even if the visual "pill" looks smaller.

### Don't:
*   **Don't** use pure white (#ffffff) for large blocks of text; use `on-surface` or `on-surface-variant` to prevent eye strain in dark mode.
*   **Don't** use standard "Material Design" shadows. If it looks like a default Android app, it has failed the premium requirement.
*   **Don't** use more than one vibrant accent color in a single component. If the "Direction Arrow" is `primary`, the "Distance Label" should be `on-surface-variant`.