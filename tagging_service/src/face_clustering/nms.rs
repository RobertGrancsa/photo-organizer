/// A simple rectangle structure to represent a bounding box.
#[derive(Copy, Clone, Debug)]
pub struct Rect {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

impl Rect {
    /// Compute the intersection-over-union (IoU) with another rectangle.
    pub fn iou(&self, other: &Rect) -> f32 {
        let x1 = self.x.max(other.x);
        let y1 = self.y.max(other.y);
        let x2 = (self.x + self.width).min(other.x + other.width);
        let y2 = (self.y + self.height).min(other.y + other.height);
        let inter_area = ((x2 - x1).max(0.0)) * ((y2 - y1).max(0.0));
        let union_area = self.width * self.height + other.width * other.height - inter_area;
        if union_area > 0.0 {
            inter_area / union_area
        } else {
            0.0
        }
    }

    /// A minimal overlap function similar to IoU (you could adjust this as needed).
    pub fn iou_min(&self, other: &Rect) -> f32 {
        let inter_area = self.intersection_area(other);
        let min_area = self.width * self.height.min(other.width * other.height);
        if min_area > 0.0 {
            inter_area / min_area
        } else {
            0.0
        }
    }

    fn intersection_area(&self, other: &Rect) -> f32 {
        let x1 = self.x.max(other.x);
        let y1 = self.y.max(other.y);
        let x2 = (self.x + self.width).min(other.x + other.width);
        let y2 = (self.y + self.height).min(other.y + other.height);
        ((x2 - x1).max(0.0)) * ((y2 - y1).max(0.0))
    }
}

/// A Face structure to hold the detection rectangle and its confidence score.
#[derive(Clone, Debug)]
pub struct Face {
    pub rect: Rect,
    pub confidence: f32,
}

/// Non-maximum suppression (NMS) structure.
#[derive(Copy, Clone, Debug)]
pub struct Nms {
    pub iou_threshold: f32,
}

impl Default for Nms {
    fn default() -> Self {
        Self { iou_threshold: 0.3 }
    }
}

impl Nms {
    /// Suppress non-maxima faces using the standard IoU metric.
    pub fn suppress_non_maxima(&self, mut faces: Vec<Face>) -> Vec<Face> {
        // Sort faces by descending confidence.
        faces.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
        let mut nms_faces = Vec::new();
        while let Some(current_face) = faces.pop() {
            nms_faces.push(current_face.clone());
            // Retain only faces with low IoU overlap.
            faces.retain(|other_face| current_face.rect.iou(&other_face.rect) < self.iou_threshold);
        }
        nms_faces
    }

    /// Suppress non-maxima faces using a minimal overlap function.
    pub fn suppress_non_maxima_min(&self, mut faces: Vec<Face>) -> Vec<Face> {
        faces.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
        let mut nms_faces = Vec::new();
        while let Some(current_face) = faces.pop() {
            nms_faces.push(current_face.clone());
            faces.retain(|other_face| {
                current_face.rect.iou_min(&other_face.rect) < self.iou_threshold
            });
        }
        nms_faces
    }
}
