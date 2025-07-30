export const preSaveHook = async function (next: any) {
  try {
    
    this.set({
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    next();
  } catch (error) {
    console.error('❌ Error in pre-save hook:', error);
    next(error);
  }
};
