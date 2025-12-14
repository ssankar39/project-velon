import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

/**
 * PUT /api/user/profile - Update user profile
 * Body: { userId: string (email), name?: string, currentPassword?: string, newPassword?: string }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, currentPassword, newPassword } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId (email) is required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection('User');

    // Find user by email
    const user = await usersCollection.findOne({ email: userId });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update name if provided
    if (name !== undefined) {
      updateData.name = name;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);

      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // Update user in database
    await usersCollection.updateOne(
      { email: userId },
      { $set: updateData }
    );

    return NextResponse.json(
      { message: 'Profile updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating profile:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to update profile', details: errorMessage },
      { status: 500 }
    );
  }
}
