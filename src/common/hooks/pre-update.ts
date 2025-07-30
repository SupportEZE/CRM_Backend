export const preUpdateHook = async function (next:any) {
  try {
    
    this.set({
      updated_at: Date.now(),
    });

    next();
  } catch (error) {
    console.error('Error in pre-update hook:', error);
    next(error);
  }
};
