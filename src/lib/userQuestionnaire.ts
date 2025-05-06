import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export type QuestionnaireStatus = 'not_started' | 'in_progress' | 'completed';

export type AnswerValue = string | number | boolean | string[] | number[] | null;

export async function startQuestionnaire(userId: string, questionnaireId: string) {
	return prisma.userQuestionnaire.create({
		data: {
			userId,
			questionnaireId,
			status: 'not_started'
		},
		include: {
			questionnaire: {
				include: {
					questions: {
						include: {
							question: true
						},
						orderBy: {
							orderIndex: 'asc'
						}
					}
				}
			}
		}
	});
}

export async function saveAnswer(
	userQuestionnaireId: string,
	questionId: string,
	answer: AnswerValue
) {
	// Start a transaction to ensure data consistency
	return prisma.$transaction(async (prismaClient: Prisma.TransactionClient) => {
		// Save the answer
		await prismaClient.userAnswer.upsert({
			where: {
				userQuestionnaireId_questionId: {
					userQuestionnaireId,
					questionId
				}
			},
			create: {
				userQuestionnaireId,
				questionId,
				answer
			},
			update: {
				answer,
				answeredAt: new Date()
			}
		});

		// Get total questions for this questionnaire
		const userQuestionnaire = await prismaClient.userQuestionnaire.findUnique({
			where: { id: userQuestionnaireId },
			include: {
				questionnaire: {
					include: {
						questions: true
					}
				},
				answers: true
			}
		});

		if (!userQuestionnaire) {
			throw new Error('User questionnaire not found');
		}

		// Calculate new status
		const totalQuestions = userQuestionnaire.questionnaire.questions.length;
		const answeredQuestions = userQuestionnaire.answers.length;

		let newStatus: QuestionnaireStatus = 'in_progress';
		let completedAt: Date | null = null;

		if (answeredQuestions === 0) {
			newStatus = 'not_started';
		} else if (answeredQuestions === totalQuestions) {
			newStatus = 'completed';
			completedAt = new Date();
		}

		// Update questionnaire status
		return prismaClient.userQuestionnaire.update({
			where: { id: userQuestionnaireId },
			data: {
				status: newStatus,
				completedAt,
				lastUpdatedAt: new Date()
			},
			include: {
				answers: {
					include: {
						question: true
					}
				}
			}
		});
	});
}

export async function getQuestionnaireProgress(userId: string, questionnaireId: string) {
	const progress = await prisma.userQuestionnaire.findUnique({
		where: {
			userId_questionnaireId: {
				userId,
				questionnaireId
			}
		},
		include: {
			questionnaire: {
				include: {
					questions: {
						include: {
							question: true
						},
						orderBy: {
							orderIndex: 'asc'
						}
					}
				}
			},
			answers: {
				include: {
					question: true
				}
			}
		}
	});

	if (!progress) {
		return null;
	}

	const totalQuestions = progress.questionnaire.questions.length;
	const answeredQuestions = progress.answers.length;

	return {
		...progress,
		totalQuestions,
		answeredQuestions,
		completionPercentage: Math.round((answeredQuestions / totalQuestions) * 100)
	};
}

export async function getUserQuestionnaires(userId: string) {
	return prisma.userQuestionnaire.findMany({
		where: {
			userId
		},
		include: {
			questionnaire: true,
			answers: true
		},
		orderBy: {
			startedAt: 'desc'
		}
	});
}

export async function deleteUserQuestionnaire(userId: string, userQuestionnaireId: string) {
	return prisma.userQuestionnaire.deleteMany({
		where: {
			id: userQuestionnaireId,
			userId // Ensure the user owns this questionnaire
		}
	});
} 