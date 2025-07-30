export const postUpdateHook = async function() {
    try {
      const doc = this;
      if (doc) {
        doc.updated_at = Date.now();
        await doc.save();
      }
    } catch (error) {
      console.error("Error in post-update hook:", error);
    }
  };